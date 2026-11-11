
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch
from captum.attr import IntegratedGradients

from .data import encode
from .models import create_model


ROOT = Path(__file__).resolve().parents[1]
CHECKPOINT = ROOT / "artifacts/cnn_encode_baseline/best.pt"
VALIDATION = ROOT / "data/processed/val.csv"
OUTPUT = ROOT / "artifacts/xai"

OUTPUT.mkdir(parents=True, exist_ok=True)


def main():
    # Load trained CNN
    ckpt = torch.load(
        CHECKPOINT,
        map_location="cpu",
        weights_only=True
    )

    model = create_model(
        ckpt["name"],
        num_classes=len(ckpt["labels"]),
        **ckpt["kwargs"]
    )

    model.load_state_dict(ckpt["state_dict"])
    model.eval()

    # Select a real validation DNA sequence
    df = pd.read_csv(VALIDATION)
    sequence = df.iloc[0]["sequence"]
    true_label = df.iloc[0]["label"]

    # Use exactly the encoding from RegulaAI training
    features = encode(sequence, ckpt["length"])

    x = torch.from_numpy(features).unsqueeze(0).float()

    # CNN prediction
    with torch.no_grad():
        logits = model(x)
        probabilities = torch.softmax(logits, dim=1)[0]

    predicted_idx = int(probabilities.argmax())
    predicted_label = ckpt["labels"][predicted_idx]

    # Integrated Gradients attribution
    ig = IntegratedGradients(model)

    attributions, delta = ig.attribute(
        inputs=x,
        baselines=torch.zeros_like(x),
        target=predicted_idx,
        n_steps=100,
        return_convergence_delta=True
    )

    # Attribution of each observed nucleotide
    attribution = attributions.detach().numpy()[0]
    encoded = x.detach().numpy()[0]

    importance = (attribution * encoded).sum(axis=1)

    # Save values for the future React dashboard
    result = pd.DataFrame({
        "position": np.arange(1, len(sequence) + 1),
        "nucleotide": list(sequence),
        "attribution": importance
    })

    result.to_csv(
        OUTPUT / "cnn_nucleotide_attributions.csv",
        index=False
    )

    # Plot
    plt.figure(figsize=(15, 4))
    plt.bar(
        result["position"],
        result["attribution"],
        width=1
    )

    plt.axhline(0, linewidth=0.8)
    plt.xlabel("DNA Position (bp)")
    plt.ylabel("Integrated Gradients Attribution")
    plt.title(
        f"RegulaAI CNN — True: {true_label} | "
        f"Predicted: {predicted_label}"
    )

    plt.tight_layout()
    plt.savefig(
        OUTPUT / "cnn_nucleotide_heatmap.png",
        dpi=300
    )
    plt.show()

    print("\n===== REGULAAI EXPLAINABLE AI =====")
    print("True class:", true_label)
    print("Predicted class:", predicted_label)
    print("Convergence delta:", float(delta.item()))
    print("Saved to:", OUTPUT)


if __name__ == "__main__":
    main()
