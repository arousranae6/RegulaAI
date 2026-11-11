
import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';

export default function ExplainableAI() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [range, setRange] = useState('all');

  useEffect(() => {
    fetch('/api/xai/cnn')
      .then(async response => {
        if (!response.ok) {
          throw new Error('Explainable AI results unavailable');
        }
        return response.json();
      })
      .then(setResult)
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return <section className="panel">{error}</section>;
  }

  if (!result) {
    return <section className="panel">Loading explanations...</section>;
  }

  const data = result.data;

  const displayed = range === 'all'
    ? data
    : data.slice(Number(range), Number(range) + 40);

  return (
    <>
      <div className="statgrid">
        <div className="stat">
          <span>Explanation Method</span>
          <strong style={{fontSize: '20px'}}>Integrated Gradients</strong>
        </div>

        <div className="stat">
          <span>Architecture</span>
          <strong>CNN</strong>
        </div>

        <div className="stat">
          <span>DNA Length</span>
          <strong>{data.length} bp</strong>
        </div>

        <div className="stat">
          <span>Input Baseline</span>
          <strong style={{fontSize: '20px'}}>Zero tensor</strong>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">NUCLEOTIDE ATTRIBUTION</span>
            <h2>DNA Position Importance</h2>
          </div>
        </div>

        <p className="muted">
          Positive attributions support the selected prediction
          relative to the zero baseline. Negative attributions
          oppose it.
        </p>

        <label className="field-label">DNA region</label>

        <select
          value={range}
          onChange={event => setRange(event.target.value)}
        >
          <option value="all">Full sequence (200 bp)</option>
          <option value="0">Positions 1–40</option>
          <option value="40">Positions 41–80</option>
          <option value="80">Positions 81–120</option>
          <option value="120">Positions 121–160</option>
          <option value="160">Positions 161–200</option>
        </select>

        <div className="chart tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayed}>
              <CartesianGrid
                stroke="#e5e7f1"
                strokeDasharray="3 4"
              />

              <XAxis
                dataKey="position"
                stroke="#64748b"
                interval={range === 'all' ? 19 : 0}
              />

              <YAxis stroke="#64748b" />

              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #ddd6fe'
                }}
                formatter={value => [
                  Number(value).toFixed(6),
                  'Attribution'
                ]}
              />

              <ReferenceLine y={0} stroke="#94a3b8" />

              <Bar dataKey="attribution">
                {displayed.map((row, index) => (
                  <Cell
                    key={index}
                    fill={
                      row.attribution >= 0
                        ? '#7c3aed'
                        : '#ef7185'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel notice">
        <div>
          <b>Scientific interpretation</b>
          <p>
            {result.warning} This graph explains one saved
            validation-sequence prediction. It does not
            establish a biologically functional DNA motif.
          </p>
        </div>
      </section>
    </>
  );
}
