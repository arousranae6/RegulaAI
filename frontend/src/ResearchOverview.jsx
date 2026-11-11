
import React, { useEffect, useState } from 'react';
import {
  Dna, BrainCircuit, FlaskConical, ChartNoAxesCombined,
  ArrowRight, Activity, Database, ShieldCheck, Sparkles
} from 'lucide-react';

const BASELINES = [
  'cnn_encode_baseline',
  'bilstm_encode_baseline',
  'cnn_bilstm_encode_baseline',
  'transformer_encode_baseline'
];

export default function ResearchOverview({
  runs = [],
  health,
  onNavigate
}) {
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    fetch('/api/test-results/cnn_encode_baseline')
      .then(r => r.ok ? r.json() : null)
      .then(setTestResults)
      .catch(() => {});
  }, []);

  const baselines = runs.filter(
    r => BASELINES.includes(r.run_name)
  );

  const best = [...baselines].sort(
    (a, b) =>
      Number(b.best_val_macro_f1) -
      Number(a.best_val_macro_f1)
  )[0];

  const testAccuracy =
    testResults?.classification_report?.accuracy;

  const metrics = [
    { label: 'DNA sequences', value: '66,117', icon: Dna },
    { label: 'Architectures', value: '04', icon: BrainCircuit },
    {
      label: 'Best validation macro-F1',
      value: best
        ? Number(best.best_val_macro_f1).toFixed(4)
        : '—',
      icon: Activity
    },
    {
      label: 'CNN test accuracy',
      value: typeof testAccuracy === 'number'
        ? (testAccuracy * 100).toFixed(2) + '%'
        : '—',
      icon: ChartNoAxesCombined
    }
  ];

  const features = [
    {
      title: 'DNA Analyzer',
      description: 'Predict regulatory categories from DNA.',
      icon: Dna,
      page: 'analyze'
    },
    {
      title: 'Model Comparison',
      description: 'Compare architectures and CPU efficiency.',
      icon: BrainCircuit,
      page: 'models'
    },
    {
      title: 'Explainable AI',
      description: 'Explore nucleotide-level contributions.',
      icon: Sparkles,
      page: 'xai'
    },
    {
      title: 'Final Evaluation',
      description: 'Inspect held-out test metrics and errors.',
      icon: ChartNoAxesCombined,
      page: 'evaluation'
    }
  ];

  return (
    <div className="research-overview">
      <section className="overview-hero">
        <div className="overview-hero-content">
          <span className="overview-tag">
            <Sparkles size={14}/>
            DEEP LEARNING · BIOINFORMATICS
          </span>

          <h2>
            Understanding regulatory DNA
            <span> through deep learning.</span>
          </h2>

          <p>
            Explore human genomic regulatory sequences,
            benchmark neural network architectures,
            and investigate predictions using explainable AI.
          </p>

          <div className="overview-actions">
            <button
              className="overview-button-primary"
              onClick={() => onNavigate('analyze')}
            >
              <Dna size={17}/>
              Analyze DNA
              <ArrowRight size={16}/>
            </button>

            <button
              className="overview-button-secondary"
              onClick={() => onNavigate('models')}
            >
              Explore models
              <ArrowRight size={16}/>
            </button>
          </div>

          <div className="overview-hero-footer">
            <ShieldCheck size={16}/>
            ENCODE SCREEN · GRCh38 · Research prototype
          </div>
        </div>

        <div className="overview-hero-visual">
          <div className="dna-decoration">
            <Dna size={120} strokeWidth={1.15}/>
          </div>
          <div className="visual-label">
            <span className="visual-dot"/>
            <span>Genomic intelligence</span>
          </div>
        </div>
      </section>

      <div className="overview-metrics">
        {metrics.map(metric => (
          <div className="overview-metric" key={metric.label}>
            <div className="overview-metric-heading">
              <span>{metric.label}</span>
              <metric.icon size={19}/>
            </div>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <div className="overview-section-header">
        <div>
          <span className="eyebrow">RESEARCH WORKSPACE</span>
          <h2>Explore RegulaAI</h2>
          <p>Access the main tools and experimental results.</p>
        </div>
      </div>

      <div className="overview-features">
        {features.map(feature => (
          <button
            className="overview-feature"
            key={feature.page}
            onClick={() => onNavigate(feature.page)}
          >
            <span className="overview-feature-icon">
              <feature.icon size={23}/>
            </span>
            <strong>{feature.title}</strong>
            <span>{feature.description}</span>
            <ArrowRight className="feature-arrow" size={18}/>
          </button>
        ))}
      </div>

      <section className="overview-bottom">
        <div>
          <span className="eyebrow">PROJECT INFORMATION</span>
          <h2>Research at a glance</h2>
          <p>
            Sequence-based classification of promoter-like,
            distal enhancer-like, and CA-CTCF regulatory elements.
            Training, validation and testing use chromosome-aware
            partitions.
          </p>
        </div>

        <div className="overview-system">
          <Database size={19}/>
          <div>
            <strong>ENCODE dataset</strong>
            <span>PLS · dELS · CA-CTCF</span>
          </div>
          <span className={
            health ? 'overview-online' : 'overview-offline'
          }>
            {health ? 'API Online' : 'API Offline'}
          </span>
        </div>
      </section>

      <p className="overview-disclaimer">
        Predictions are computational estimates and do not
        establish experimentally validated regulatory function.
      </p>
    </div>
  );
}
