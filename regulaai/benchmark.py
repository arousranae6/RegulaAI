
import gc
import json
import time
from pathlib import Path

import numpy as np
import pandas as pd
import torch

from .models import create_model

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
OUTPUT = ARTIFACTS / "benchmark"
OUTPUT.mkdir(parents=True, exist_ok=True)

RUNS = {
    "CNN": "cnn_encode_baseline",
    "BiLSTM": "bilstm_encode_baseline",
    "CNN-BiLSTM": "cnn_bilstm_encode_baseline",
    "Transformer": "transformer_encode_baseline",
}

BATCH_SIZE = 32
WARMUP = 10
REPETITIONS = 50

def main():
    results = []

    for name, run in RUNS.items():
        print(f"\nBenchmarking {name}...", flush=True)

        path = ARTIFACTS / run / "best.pt"

        if not path.exists():
            print("Checkpoint missing:", run)
            continue

        checkpoint = torch.load(
            path,
            map_location="cpu",
            weights_only=True
        )

        model = create_model(
            checkpoint["name"],
            num_classes=len(checkpoint["labels"]),
            **checkpoint["kwargs"]
        )

        model.load_state_dict(checkpoint["state_dict"])
        model.eval()

        length = int(checkpoint["length"])

        # Valid random one-hot DNA inputs
        rng = np.random.default_rng(42)
        indices = rng.integers(
            0, 4,
            size=(BATCH_SIZE, length)
        )

        x = torch.nn.functional.one_hot(
            torch.as_tensor(indices, dtype=torch.long),
            num_classes=4
        ).float()

        with torch.inference_mode():
            for _ in range(WARMUP):
                model(x)

            times = []

            for _ in range(REPETITIONS):
                start = time.perf_counter()
                model(x)
                times.append(
                    (time.perf_counter() - start) * 1000
                )

        median_ms = float(np.median(times))
        throughput = BATCH_SIZE * 1000 / median_ms

        parameters = sum(
            p.numel() for p in model.parameters()
        )

        results.append({
            "Architecture": name,
            "Run": run,
            "Parameters": parameters,
            "Batch Latency (ms)": round(median_ms, 3),
            "Throughput (seq/s)": round(throughput, 2),
            "Validation Macro-F1": float(
                checkpoint["best_val_macro_f1"]
            ),
            "Device": "CPU",
            "Batch Size": BATCH_SIZE,
            "Sequence Length": length,
        })

        print(
            f"Median batch latency: {median_ms:.3f} ms"
        )
        print(
            f"Throughput: {throughput:.2f} sequences/s"
        )

        del model, x
        gc.collect()

    df = pd.DataFrame(results)

    filename = OUTPUT / "computational_benchmark.csv"
    df.to_csv(filename, index=False)

    print("\n===== FINAL BENCHMARK =====")
    print(df.to_string(index=False))
    print("\nSaved to:", filename)

if __name__ == "__main__":
    main()
