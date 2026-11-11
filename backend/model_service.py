
from pathlib import Path
from functools import lru_cache

import numpy as np
import torch

from regulaai.models import create_model

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"

RUNS = {
    "cnn": "cnn_encode_baseline",
    "bilstm": "bilstm_encode_baseline",
    "cnn_bilstm": "cnn_bilstm_encode_baseline",
    "transformer": "transformer_encode_baseline",
}

BASES = "ACGT"


def available_models():
    return [
        name for name, run in RUNS.items()
        if (ARTIFACTS / run / "best.pt").is_file()
    ]


@lru_cache(maxsize=4)
def load_model(name):
    if name not in RUNS:
        raise ValueError("Unknown architecture")

    path = ARTIFACTS / RUNS[name] / "best.pt"

    if not path.is_file():
        raise FileNotFoundError(
            f"Checkpoint unavailable for {name}"
        )

    # Checkpoints must come from your trusted training runs.
    ckpt = torch.load(
        path,
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

    return model, ckpt


def predict_sequence(sequence, model_name="cnn"):
    model, ckpt = load_model(model_name)

    sequence = sequence.strip().upper()
    length = int(ckpt["length"])

    if len(sequence) != length:
        raise ValueError(
            f"Expected {length} bp; received "
            f"{len(sequence)} bp."
        )

    if any(base not in BASES for base in sequence):
        raise ValueError(
            "DNA must contain only A, C, G or T."
        )

    encoded = np.zeros((length, 4), dtype=np.float32)

    for i, base in enumerate(sequence):
        encoded[i, BASES.index(base)] = 1.0

    tensor = torch.from_numpy(
        encoded
    ).unsqueeze(0)

    with torch.inference_mode():
        logits = model(tensor)
        probabilities = torch.softmax(
            logits, dim=1
        )[0].tolist()

    labels = list(ckpt["labels"])
    predicted_idx = int(np.argmax(probabilities))

    return {
        "model": model_name,
        "sequence_length": length,
        "prediction": labels[predicted_idx],
        "probabilities": {
            label: round(float(prob), 6)
            for label, prob in zip(labels, probabilities)
        }
    }

