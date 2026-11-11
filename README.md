# RegulaAI — Comparative Deep Learning for Genomic DNA Classification

**Research-first starter repository**: CNN, BiLSTM, CNN–BiLSTM, Transformer; FastAPI; React + Vite.

> **IMPORTANT:** The synthetic dataset is **only a software integration test**. It contains inserted artificial motifs and DOES NOT represent ENCODE biological evidence. No trained weights or real model results are shipped. Do not make biological claims based on synthetic demo outputs.

## Phase 1 — Run locally (Windows PowerShell)

Prerequisites: Python 3.10+ and Node.js 20.19+ or 22.12+ (recent releases preferred). On Windows, run from the project root.

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m regulaai.demo --length 200
python -m regulaai.train --model cnn --data data/demo --length 200 --epochs 4 --run-name cnn_demo
python -m regulaai.test_model --checkpoint artifacts/cnn_demo/best.pt --data data/demo
python -m uvicorn backend.main:app --reload
```

Keep that terminal open. Open **another terminal**:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173` (FastAPI at `http://127.0.0.1:8000/docs`). In the DNA Analyzer, enter **exactly 200** A/C/G/T bases to match the demo model. All demo predictions must be treated as software tests, not as biological findings.

### Linux/macOS quick start

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m regulaai.demo
python -m regulaai.train --model cnn --data data/demo --length 200 --epochs 4 --run-name cnn_demo
uvicorn backend.main:app --reload
```

Start frontend in a second shell: `cd frontend && npm install && npm run dev`.

## Phase 2 — Real ENCODE data

1. Download **human GRCh38 BED** files for **PLS**, **dELS**, and **CA-CTCF** from <https://screen.wenglab.org/downloads> and place them under `data/raw/`. Actual BED filenames depend on SCREEN downloads.
2. Download UCSC **hg38.fa.gz** from <https://genome-ftp.cse.ucsc.edu/goldenPath/hg38/bigZips/latest/hg38.fa.gz>. Uncompress to `data/raw/hg38.fa` (approx. 3 GB expanded). Make sure all files are **GRCh38/hg38**.
3. Extract fixed-length windows:

```bash
python -m regulaai.prepare --pls data/raw/PLS.bed --dels data/raw/dELS.bed --ctcf data/raw/CA-CTCF.bed --fasta data/raw/hg38.fa --length 200 --max-per-class 10000 --output data/processed
```

Replace example `.bed` filenames with the exact files downloaded. BED `.gz` is supported. The preprocessing script filters overlapping windows conservatively and creates chromosome-based train/validation/test splits (chr8=val, chr9=test). **Inspect class counts**: chromosome splits are intentionally not guaranteed to be balanced. For any research report also investigate cross-partition homology, repeat regions, chromosome-specific bias, background GC content, and potential label overlap/selection artifacts. Prevent data leakage by selecting hyperparameters using validation data, not test data.

```bash
python -m regulaai.train --data data/processed --model cnn --length 200 --epochs 12 --run-name real_cnn_kernel7
python -m regulaai.train --data data/processed --model bilstm --length 200 --epochs 12 --run-name real_bilstm128
python -m regulaai.train --data data/processed --model cnn_bilstm --length 200 --epochs 12 --run-name real_hybrid
python -m regulaai.train --data data/processed --model transformer --length 200 --epochs 12 --run-name real_transformer
```

> **Research limitation:** cCRE annotations use chromatin evidence and genomic positional criteria. Sequence-only classification estimates these annotations; it does **not** prove enhancer/promoter function. This starter is not a validated biological predictor. Promoter labels may be especially influenced by genomic context. Make robust controls and rigorous evaluation part of the project.

## Phase 3 — Controlled experiments

- **CNN kernel**: `--model cnn --kernel-size 3/7/15`
- **BiLSTM hidden size**: `--model bilstm --hidden-size 64/128/256`
- **Transformer attention heads**: `--model transformer --heads 2/4/8 --d-model 64`
- **Learning rate**: `--lr 0.001/0.0003/0.0001`
- **Dropout**: `--dropout 0/0.2/0.5`
- **Sequence window**: rerun `regulaai.prepare` for 200/500/1000bp to distinct output folders; train with matching `--length`.
- **Time/parameter count**: logged automatically in each run's `metrics.json`.
- **Ablation studies**: implement well-defined component-removal variants after baselines; do not treat kernel/head/size tuning as ablation by itself.
- **Reproducibility**: repeated seeds, comparable training budgets, validation-based checkpoint selection; final held-out test once model selection is frozen.

The example baseline is deliberately compact. For reporting, extend with per-class metrics, repeated-seed uncertainty, calibration, mixed-precision GPU runs, MLflow and GPU memory tracking.

## Project layout

```
regulaai/          # Models, encoders, data extraction, training, evaluation
backend/main.py    # FastAPI service (no fake predictions)
frontend/          # React + Vite web interface
 tests/            # Model/encoder smoke tests
 data/raw/         # downloaded genomic files (ignored by Git)
 data/demo/        # generated synthetic data (ignored by Git)
 data/processed/   # real extracted sequences (ignored by Git)
 artifacts/        # model checkpoints + metrics (ignored by Git)
```

## Limitations / next milestone

This is **v0.1 (working scaffold)**, not the completed research study. No biological dataset is included, no biological model has been trained, and clinical/pathogenic conclusions are not supported. Next work: validate the actual BED file fields/labels, run exploratory data analysis, add GC-matched controls and external holdouts, implement experiment tracking/plotting, ablations, explainability and deployment.

## References

- [ENCODE SCREEN downloads](https://screen.wenglab.org/downloads)
- [UCSC hg38 FASTA](https://genome-ftp.cse.ucsc.edu/goldenPath/hg38/bigZips/latest/hg38.fa.gz)
- [Vite documentation](https://vite.dev/guide/)
