
import React, { useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from 'recharts';

const BASELINES = [
  { id: 'cnn_encode_baseline', label: 'CNN' },
  { id: 'bilstm_encode_baseline', label: 'BiLSTM' },
  { id: 'cnn_bilstm_encode_baseline', label: 'CNN–BiLSTM' },
  { id: 'transformer_encode_baseline', label: 'Transformer' }
];

export default function LearningCurveComparison({ runs }) {
  const [first, setFirst] = useState('cnn_encode_baseline');
  const [second, setSecond] = useState('cnn_bilstm_encode_baseline');

  const a = runs.find(r => r.run_name === first);
  const b = runs.find(r => r.run_name === second);

  const epochs = Array.from(
    new Set([
      ...(a?.history || []).map(r => r.epoch),
      ...(b?.history || []).map(r => r.epoch)
    ])
  ).sort((x, y) => x - y);

  const data = epochs.map(epoch => ({
    epoch,
    modelA: a?.history?.find(r => r.epoch === epoch)?.val_macro_f1 ?? null,
    modelB: b?.history?.find(r => r.epoch === epoch)?.val_macro_f1 ?? null
  }));

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow">LEARNING DYNAMICS</span>
          <h2>Validation Performance Across Epochs</h2>
        </div>
      </div>

      <div className="two-col">
        <div>
          <label className="field-label">Model A</label>
          <select value={first} onChange={e => setFirst(e.target.value)}>
            {BASELINES.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label">Model B</label>
          <select value={second} onChange={e => setSecond(e.target.value)}>
            {BASELINES.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="chart tall">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#e5e7f1" strokeDasharray="3 4" />
            <XAxis dataKey="epoch" stroke="#64748b" />
            <YAxis domain={[0, 1]} stroke="#64748b" />
            <Tooltip />
            <Legend />
            <Line
              name={BASELINES.find(m => m.id === first)?.label}
              type="monotone"
              dataKey="modelA"
              stroke="#7c3aed"
              strokeWidth={2}
            />
            <Line
              name={BASELINES.find(m => m.id === second)?.label}
              type="monotone"
              dataKey="modelB"
              stroke="#2563eb"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="muted">
        Curves show validation macro-F1 from the original saved
        training histories. They do not represent test-set performance.
      </p>
    </section>
  );
}
