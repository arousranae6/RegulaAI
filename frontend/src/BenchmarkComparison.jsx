
import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LabelList
} from 'recharts';

export default function BenchmarkComparison() {
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/benchmark')
      .then(async response => {
        if (!response.ok) {
          throw new Error('Benchmark data unavailable');
        }
        return response.json();
      })
      .then(data => setResults(data.results || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <section className="panel">Loading CPU benchmark...</section>;
  }

  if (error) {
    return <section className="panel">{error}</section>;
  }

  if (!results.length) {
    return <section className="panel">No benchmark results found.</section>;
  }

  const fastest = [...results].sort(
    (a, b) => a.latency_ms - b.latency_ms
  )[0];

  const smallest = [...results].sort(
    (a, b) => a.parameters - b.parameters
  )[0];

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">COMPUTATIONAL EFFICIENCY</span>
            <h2>Performance vs Inference Speed</h2>
          </div>
        </div>

        <p className="muted">
          Validation macro-F1 versus median CPU inference latency.
          All architectures were benchmarked with batches of
          32 DNA sequences.
        </p>

        <div className="two-col">
          <div className="stat">
            <span>Fastest Architecture</span>
            <strong style={{fontSize: '22px'}}>
              {fastest.architecture}
            </strong>
            <small>
              {fastest.latency_ms.toFixed(3)} ms per batch
            </small>
          </div>

          <div className="stat">
            <span>Smallest Architecture</span>
            <strong style={{fontSize: '22px'}}>
              {smallest.architecture}
            </strong>
            <small>
              {smallest.parameters.toLocaleString()} parameters
            </small>
          </div>
        </div>

        <div className="chart tall">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 30, right: 45, bottom: 15, left: 5 }}
            >
              <CartesianGrid
                stroke="#e5e7f1"
                strokeDasharray="3 4"
              />

              <XAxis
                type="number"
                dataKey="latency_ms"
                name="CPU Latency"
                unit=" ms"
                domain={[0, 'dataMax + 10']}
                stroke="#64748b"
              />

              <YAxis
                type="number"
                dataKey="validation_macro_f1"
                name="Validation Macro-F1"
                domain={[0, 0.7]}
                stroke="#64748b"
              />

              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{
                      background: '#ffffff',
                      color: '#fff',
                      padding: 12,
                      border: '1px solid #ddd6fe',
                      borderRadius: 6
                    }}>
                      <b>{d.architecture}</b>
                      <div>Latency: {d.latency_ms} ms</div>
                      <div>Macro-F1: {d.validation_macro_f1.toFixed(5)}</div>
                    </div>
                  );
                }}
              />

              <Scatter
                name="Architectures"
                data={results}
                fill="#7c3aed"
              >
                <LabelList
                  dataKey="architecture"
                  position="top"
                  fill="#b9c7dd"
                />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">CPU BENCHMARK</span>
            <h2>Computational Requirements</h2>
          </div>
        </div>

        <div className="scrolltable">
          <table>
            <thead>
              <tr>
                <th>Architecture</th>
                <th>Parameters</th>
                <th>Latency (ms)</th>
                <th>Throughput (seq/s)</th>
                <th>Validation F1</th>
              </tr>
            </thead>
            <tbody>
              {[...results]
                .sort((a, b) => a.latency_ms - b.latency_ms)
                .map(r => (
                  <tr key={r.run_name}>
                    <td><b>{r.architecture}</b></td>
                    <td>{r.parameters.toLocaleString()}</td>
                    <td>{r.latency_ms.toFixed(3)}</td>
                    <td>{r.throughput.toFixed(2)}</td>
                    <td>{r.validation_macro_f1.toFixed(5)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <p className="muted">
          CPU inference benchmark on the same Windows computer.
          Latency refers to a batch of 32 sequences, not one
          individual sequence. GPU memory was not measured.
        </p>
      </section>
    </>
  );
}
