
import React from 'react';

const BASELINES = [
  ['cnn_encode_baseline', '1D CNN'],
  ['bilstm_encode_baseline', 'BiLSTM'],
  ['cnn_bilstm_encode_baseline', 'CNN–BiLSTM'],
  ['transformer_encode_baseline', 'Transformer']
];

export default function ArchitectureTable({ runs }) {
  const rows = BASELINES.map(([id, name]) => {
    const run = runs.find(r => r.run_name === id);
    return run ? { ...run, displayName: name } : null;
  }).filter(Boolean).sort(
    (a, b) => b.best_val_macro_f1 - a.best_val_macro_f1
  );

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">MODEL BENCHMARK</span>
          <h2>Baseline Architecture Comparison</h2>
        </div>
      </div>

      <p className="muted">
        Validation performance on chromosome 8,
        using 200-bp ENCODE SCREEN sequences.
      </p>

      <div className="scrolltable">
        <table>
          <thead>
            <tr>
              <th>Architecture</th>
              <th>Parameters</th>
              <th>Validation Macro-F1</th>
              <th>Best Model Available</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(run => (
              <tr key={run.run_name}>
                <td><b>{run.displayName}</b></td>
                <td>{Number(run.parameters).toLocaleString()}</td>
                <td>{Number(run.best_val_macro_f1).toFixed(5)}</td>
                <td>{run.checkpoint_available ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
