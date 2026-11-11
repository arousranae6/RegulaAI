
import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Cell
} from 'recharts';

export default function FinalEvaluation() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/test-results/cnn_encode_baseline')
      .then(async response => {
        if (!response.ok) {
          throw new Error('Evaluation results unavailable');
        }
        return response.json();
      })
      .then(setResults)
      .catch(err => setError(err.message));
  }, []);

  if (error) return <section className="panel">{error}</section>;
  if (!results) return <section className="panel">Loading evaluation...</section>;

  const report = results.classification_report;
  const classes = ['PLS', 'dELS', 'CA-CTCF'];
  const matrix = results.confusion_matrix;

  const f1Data = classes.map(name => ({
    name,
    f1: report[name]['f1-score']
  }));

  return (
    <>
      <div className="statgrid">
        <div className="stat">
          <span>Test Accuracy</span>
          <strong>{(report.accuracy * 100).toFixed(2)}%</strong>
        </div>
        <div className="stat">
          <span>Test Macro-F1</span>
          <strong>{report['macro avg']['f1-score'].toFixed(3)}</strong>
        </div>
        <div className="stat">
          <span>Macro AUROC</span>
          <strong>{results.macro_auroc.toFixed(3)}</strong>
        </div>
        <div className="stat">
          <span>Test Sequences</span>
          <strong>{report['macro avg'].support.toLocaleString()}</strong>
        </div>
      </div>

      <div className="two-col">
        <section className="panel">
          <h2>Per-Class F1 Score</h2>
          <p className="muted">Performance on held-out chromosome 9</p>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={f1Data}>
                <CartesianGrid stroke="#e5e7f1" strokeDasharray="3 4" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis domain={[0, 1]} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="f1" fill="#7c3aed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <h2>Confusion Matrix</h2>
          <p className="muted">Rows: true category · Columns: predicted category</p>

          <div className="scrolltable">
            <table>
              <thead>
                <tr>
                  <th>True / Pred.</th>
                  {classes.map(c => <th key={c}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={classes[i]}>
                    <td><b>{classes[i]}</b></td>
                    {row.map((value, j) => (
                      <td key={j}>{value.toLocaleString()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="panel notice">
        <div>
          <b>Scientific interpretation</b>
          <p>
            The CNN was evaluated on 16,645 held-out genomic sequences
            from chromosome 9. Performance reflects sequence-based
            classification of ENCODE SCREEN annotations, not experimental
            validation of regulatory activity.
          </p>
        </div>
      </section>
    </>
  );
}
