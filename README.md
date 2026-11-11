# RegulaAI 🧬

### Comparative and Explainable Deep Learning for Human Genomic Regulatory DNA Sequence Classification

**RegulaAI** is a bioinformatics research platform designed to compare deep learning architectures for the classification of human genomic regulatory DNA sequences.

The project combines **PyTorch, FastAPI and React** into an interactive scientific dashboard for sequence classification, model benchmarking, experiment analysis and nucleotide-level explainability.

**Project status:** Functional local research prototype with recorded experiments using ENCODE SCREEN-derived regulatory genomic data.

## Key features

- **DNA Analyzer:** Predict regulatory annotation classes from 200 bp DNA sequences, with live nucleotide validation.
- **Experiment Lab:** Explore recorded training runs, configurations, learning curves and validation metrics.
- **Model Comparison:** Compare CNN, BiLSTM, CNN–BiLSTM and Transformer models.
- **Final Evaluation:** Inspect held-out test performance, classification reports and confusion matrices.
- **Explainable AI:** Visualize nucleotide contributions through Integrated Gradients.
- **Computational Benchmark:** Compare inference latency, throughput and model complexity.
- **Interactive Dashboard:** React interface with a white, purple and blue research-oriented design.

## 1. Research objective

The main objective is to investigate how different neural network architectures perform when classifying human regulatory DNA sequences.

Three ENCODE SCREEN-related regulatory annotation classes are considered:

| Class | Description |
|---|---|
| PLS | Promoter-like signature |
| dELS | Distal enhancer-like signature |
| CA-CTCF | CTCF-associated category |

The project evaluates both predictive performance and computational efficiency, while using explainability to examine which nucleotide positions influence individual predictions.

These annotation categories do not constitute experimental proof of regulatory function.

## 2. Dataset

The recorded experiments use fixed-length **200 bp sequences** derived from GRCh38/hg38 regulatory genomic regions.

| Dataset split | Number of sequences |
|---|---:|
| Training | 30,000 |
| Validation (chromosome 8) | 19,472 |
| Testing (chromosome 9) | 16,645 |
| **Total** | **66,117** |

The training set contains 10,000 sequences per class. The chromosome-separated validation and test datasets are not class-balanced.

A chromosome-aware split is used to reduce direct data leakage, although additional genomic bias and homology analyses remain necessary.

## 3. Deep learning architectures

Four architectures were implemented and evaluated:

**CNN — Convolutional Neural Network**

Learns local sequence patterns through convolutional filters.

**BiLSTM — Bidirectional Long Short-Term Memory**

Models sequence dependencies through forward and backward recurrent processing.

**CNN–BiLSTM — Hybrid architecture**

Combines local convolutional feature extraction with bidirectional sequence modeling.

**Transformer**

Uses an attention-based architecture for sequence representation learning.

## 4. Experimental results

### Validation performance

The following results represent the best validation macro-F1 recorded in each model's training metrics.

| Model | Parameters | Best validation macro-F1 |
|---|---:|---:|
| **CNN** | 43,715 | **0.55340** |
| CNN–BiLSTM | 201,283 | 0.54315 |
| Transformer | 113,411 | 0.51779 |
| BiLSTM | 137,987 | 0.50216 |

The CNN achieved the highest validation macro-F1 among the recorded baseline experiments.

**Metric consistency note:** The computational benchmark CSV lists BiLSTM validation macro-F1 as 0.50911, whereas the corresponding training metrics file records 0.50216. This discrepancy requires reconciliation before formal scientific reporting.

### Held-out CNN test performance

Results from the saved held-out test evaluation:

| Metric | Result |
|---|---:|
| Accuracy | 54.13% |
| Macro-F1 | 0.55333 |
| Macro-AUROC | 0.72912 |
| Macro-AUPRC | 0.60568 |

Per-class performance:

| Class | F1-score | Test samples |
|---|---:|---:|
| PLS | 0.60559 | 1,768 |
| dELS | 0.56576 | 10,000 |
| CA-CTCF | 0.48865 | 4,877 |

These results demonstrate a functioning comparative research pipeline but also reveal substantial limitations in prediction performance.

Because dELS represents approximately 60.1% of the test set, a majority-class classifier would achieve higher overall accuracy than the evaluated CNN. Macro-F1 and per-class performance therefore provide essential additional context.

Detailed results are available in `artifacts/cnn_encode_baseline/test_results.json`.

## 5. Computational efficiency

CPU inference measurements using a batch size of 32 and 200 bp sequences:

| Architecture | Batch latency | Throughput |
|---|---:|---:|
| CNN | 9.589 ms | 3,336.98 sequences/s |
| CNN–BiLSTM | 20.887 ms | 1,532.06 sequences/s |
| BiLSTM | 47.599 ms | 672.29 sequences/s |
| Transformer | 55.666 ms | 574.85 sequences/s |

The CNN achieved the lowest measured inference latency in the recorded CPU benchmark.

Results are saved in `artifacts/benchmark/computational_benchmark.csv`.

## 6. Explainable AI

RegulaAI integrates **Integrated Gradients**, implemented using Captum, to examine nucleotide-position contributions to CNN predictions.

The explanation workflow includes:

- Per-nucleotide attribution scores.
- Interactive visualization across the 200 bp sequence.
- On-demand explanations for the baseline CNN.
- A zero-tensor attribution baseline and 100 integration steps.
- Saved example attributions for reproducibility.

Integrated Gradients explains the model's response relative to its selected baseline. It does not independently establish causal biological motifs or experimentally verified regulatory activity.

## 7. Technology stack

| Component | Technology |
|---|---|
| Deep learning | Python, PyTorch |
| Data processing | pandas, NumPy |
| Evaluation | scikit-learn |
| Explainability | Captum |
| Backend | FastAPI, Uvicorn |
| Frontend | React, Vite |
| Visualizations | Recharts |
| Interface icons | Lucide |
| Genomic reference | GRCh38/hg38 |

## 8. Installation

### Clone the repository

```powershell
git clone https://github.com/arousranae6/RegulaAI.git
cd RegulaAI
```

### Create and activate the Python environment

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Install dependencies

```powershell
python -m pip install -r requirements.txt
python -m pip install captum
```

Captum is currently installed separately because the committed requirements file does not yet list it.

### Start the backend

From the project root:

```powershell
python -m uvicorn backend.main:app --reload --port 8000
```

FastAPI documentation is available at:

http://127.0.0.1:8000/docs

### Start the frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local address shown by Vite, usually:

http://127.0.0.1:5173/

If this port is occupied, Vite may select another available port.

### Model checkpoints

The GitHub repository intentionally excludes trained `.pt` checkpoints.

To enable model inference, a compatible trained checkpoint must exist at:

`artifacts/<run_name>/best.pt`

On-demand Integrated Gradients specifically requires:

`artifacts/cnn_encode_baseline/best.pt`

Without these checkpoints, saved experiment results remain accessible but new predictions and dynamic explanations will not work.

## 9. Reproducing data preparation

Raw genome files and extracted datasets are intentionally excluded from GitHub.

Download the appropriate GRCh38 regulatory BED files from ENCODE SCREEN and the corresponding UCSC hg38 reference FASTA.

Example preprocessing command:

```powershell
python -m regulaai.prepare --pls data/raw/PLS.bed --dels data/raw/dELS.bed --ctcf data/raw/CA-CTCF.bed --fasta data/raw/hg38.fa --length 200 --max-per-class 10000 --output data/processed
```

Replace the example BED paths with the actual downloaded filenames.

Example CNN training command:

```powershell
python -m regulaai.train --data data/processed --model cnn --length 200 --epochs 10 --run-name cnn_encode_baseline
```

Additional supported model identifiers include `bilstm`, `cnn_bilstm` and `transformer`.

Reproduction depends on matching preprocessing, training configuration, data partitioning and software environment.

## 10. Repository organization

```text
RegulaAI/
├── artifacts/           # Evaluation metrics, benchmarks, XAI examples
├── backend/             # FastAPI and model inference
├── frontend/            # React scientific dashboard
├── regulaai/            # Data processing, training, models and XAI
├── tests/               # Software tests
├── EXPERIMENT_PLAN.md   # Experimental design
├── requirements.txt     # Python dependencies
└── README.md            # Documentation
```

### Run tests

From the repository root:

```powershell
python -m pytest tests
npm --prefix frontend run build
```

## 11. Limitations and future developments

The project currently has several important limitations:

- Moderate predictive performance and class imbalance.
- Potential chromosome-specific, GC-content and genomic annotation biases.
- Limited model uncertainty and repeated-seed analysis.
- Dynamic explanations currently restricted to the baseline CNN.
- Trained checkpoints not distributed with the repository.
- No publicly hosted prediction service yet.
- A discrepancy in the saved BiLSTM validation metrics that requires investigation.

Future developments include more rigorous model validation, improved negative controls, expanded hyperparameter analysis, stronger explainability validation and public deployment.

## 12. Research disclaimer

RegulaAI is an academic research prototype.

Its outputs estimate genomic regulatory annotation classes and must not be interpreted as experimentally verified enhancer activity, promoter activity, CTCF binding, or clinical evidence.

The synthetic demo dataset is intended only for software testing and is not used to support biological performance claims.

## References and resources

- [ENCODE SCREEN](https://screen.wenglab.org/downloads)
- [UCSC Genome Browser — hg38 reference](https://genome-ftp.gi.ucsc.edu/goldenPath/hg38/bigZips/latest/hg38.fa.gz)
- [PyTorch](https://pytorch.org/)
- [Captum](https://captum.ai/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Vite](https://vite.dev/)

---

**RegulaAI — Comparative and Explainable Deep Learning for Genomic Regulatory Sequence Analysis**
