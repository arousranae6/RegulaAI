# RegulaAI experimental protocol — preregistration draft

## Main question
How do convolutional, recurrent and self-attention architectures differ in learning regulatory category patterns from DNA sequence alone?

## Labels and scientific caveats
Use ENCODE SCREEN GRCh38 cCRE classes (PLS, dELS, CA-CTCF) as *annotation targets*, not experimentally confirmed biological ground truth. Check class overlap, annotation definition, TSS confounding, repeat artifacts and label ambiguity.

## Data plan
1. Download registry BED and GRCh38 FASTA.
2. Extract equal-length reference windows; remove overlaps and ambiguous bases; document class losses.
3. Chromosome-based held-out validation/test split and sequence similarity audit.
4. Test GC-matched background, simple k-mer logistic baseline, and sensitivity to chromosome choice.
5. Report per-class counts and all data provenance (version, assembly, date, preprocessing).

## Architectures
- CNN: conv1d + normalization + pooling.
- BiLSTM: bidirectional recurrent model.
- CNN–BiLSTM: convolution then bidirectional recurrent model.
- Transformer: linear nucleotide embedding, learned positional embedding, self-attention encoder.

## Experiments
| Family | Settings | Outcome |
|---|---|---|
| Architecture | CNN, BiLSTM, hybrid, Transformer | macro-F1, per-class F1, AUPRC |
| CNN kernel | 3, 7, 15 | receptive field impact |
| LSTM width | 64, 128, 256 | capacity |
| Transformer heads | 2, 4, 8 at fixed d_model | attention configuration |
| Learning rate | 1e-3, 3e-4, 1e-4 | convergence |
| Dropout | 0, 0.2, 0.5 | generalization |
| Sequence length | 200, 500, 1000 | positional context |
| Efficiency | parameters, train/inference time, GPU peak memory | cost/performance |
| Ablations | no bidirectionality, no CNN branch, positional encoding removed | component contribution |

Select configurations using validation metrics. Avoid hyperparameter selection on test. Report median and dispersion over at least three seeds for key conclusions. Lock test set until final evaluation. Include biologically meaningful interpretability and simple-control baselines.
