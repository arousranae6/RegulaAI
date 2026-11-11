import ResearchOverview from './ResearchOverview';
import LearningCurveComparison from './LearningCurveComparison';
import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import{Activity,Atom,BrainCircuit,ChartNoAxesCombined,ChevronRight,CircleAlert,Database,FileUp,FlaskConical,Github,Layers3,Menu,Play,Search,ShieldCheck,SlidersHorizontal}from'lucide-react';
import{ResponsiveContainer,LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,Legend,BarChart,Bar}from'recharts';
import FinalEvaluation from './FinalEvaluation';
import ArchitectureTable from './ArchitectureTable';
import ExplainableAI from './ExplainableAI';
import BenchmarkComparison from './BenchmarkComparison';
import './style.css';
const LABELS=['PLS','dELS','CA-CTCF'];
const NAV=[{id:'overview',name:'Overview',icon:Activity},{id:'analyze',name:'DNA Analyzer',icon:Atom},{id:'experiments',name:'Experiment Lab',icon:FlaskConical},{id:'models',name:'Model Comparison',icon:Layers3},{id:'datasets',name:'Dataset & Methods',icon:Database},{id:'evaluation',name:'Final Evaluation',icon:ChartNoAxesCombined},{id:'xai',name:'Explainable AI',icon:BrainCircuit}];
const API='/api';
function App(){
 const[active,setActive]=useState('overview'),[runs,setRuns]=useState([]),[health,setHealth]=useState(false),[error,setError]=useState('');
 const[sequence,setSequence]=useState(''),[runName,setRunName]=useState(''),[prediction,setPrediction]=useState(null),[busy,setBusy]=useState(false),[menu,setMenu]=useState(false);
 useEffect(()=>{fetch(`${API}/health`).then(r=>r.ok?setHealth(true):null).catch(()=>{});fetch(`${API}/experiments`).then(r=>r.json()).then(d=>setRuns(d.runs||[])).catch(()=>{});},[]);
 const[dynamicXAI,setDynamicXAI]=useState(null);
 const[xaiBusy,setXaiBusy]=useState(false);
 const[xaiError,setXaiError]=useState('');
 




 const selected=runs.find(r=>r.run_name===runName)||runs[0];
 async function analyze(){setError('');setPrediction(null);setBusy(true);
  try{const r=await fetch(`${API}/predict`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sequence:sequence.trim().toUpperCase(),run_name:runName||null})});const d=await r.json();if(!r.ok)throw Error(typeof d.detail==='string'?d.detail:JSON.stringify(d.detail));setPrediction(d);}catch(e){setError(e.message)}finally{setBusy(false)}
 }
 async function explainPrediction(){
    setXaiError('');
    setDynamicXAI(null);
    setXaiBusy(true);

    try{
      const response=await fetch('/api/xai/explain',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          sequence:sequence.trim().toUpperCase(),
          run_name:'cnn_encode_baseline'
        })
      });

      const data=await response.json();

      if(!response.ok)
        throw Error(
          typeof data.detail==='string'
          ? data.detail
          : JSON.stringify(data.detail)
        );

      setDynamicXAI(data);
    }catch(err){
      setXaiError(err.message);
    }finally{
      setXaiBusy(false);
    }
  }
  function upload(e){const file=e.target.files?.[0];if(!file)return;file.text().then(s=>{const clean=s.split(/\r?\n/).filter(line=>!line.startsWith('>')).join('').replace(/\s+/g,'').toUpperCase();setSequence(clean);setError('')})}
 const header={overview:['Research overview','An experimental genomics deep-learning workspace.'],analyze:['DNA sequence analyzer','Run trained models on DNA sequences.'],experiments:['Experiment laboratory','Inspect real training history and hyperparameter configurations.'],models:['Architecture comparison','Compare recorded experiments without invented scores.'],datasets:['Data & methodology','Research design, source data, and validation rules.'],evaluation:['Final model evaluation','Held-out chromosome 9 test performance.'],xai:['Explainable AI','Understand nucleotide contributions to CNN predictions.'],}[active];
 return <div className="shell"><aside className={'sidebar '+(menu?'open':'')}><div className="brand"><span className="logo"><Atom size={22}/></span><span><b>Regula<span className="brandaccent">AI</span></b><small>GENOMIC INTELLIGENCE</small></span></div><div className="side-label">WORKSPACE</div><nav>{NAV.map(n=><button className={'navitem '+(active===n.id?'active':'')} key={n.id} onClick={()=>{setActive(n.id);setMenu(false)}}><n.icon size={18}/>{n.name}{active===n.id&&<span className="navdot"/>}</button>)}</nav><div className="aside-bottom"><div className="status"><span className={'statusdot '+(health?'online':'')}/>{health?'API connected':'API offline'}<small>v0.1</small></div><p>Scientific prototype<br/>Real predictions require trained checkpoints.</p></div></aside><main className="main"><div className="topbar"><button className="menubtn" onClick={()=>setMenu(!menu)}><Menu size={20}/></button><span>RESEARCH PLATFORM <ChevronRight size={14}/> {header[0].toUpperCase()}</span><a target="_blank" rel="noreferrer" href="https://screen.wenglab.org/downloads"><Database size={16}/> ENCODE Dataset</a></div><div className="content"><div className="page-header"><div><span className="eyebrow">REGULAAI / {active.toUpperCase()}</span><h1>{header[0]}</h1><p>{header[1]}</p></div><span className="chip"><span className="statusdot online"/> RESEARCH BUILD · 0.1</span></div>
 {active==='overview'&&
  <ResearchOverview
    runs={runs}
    health={health}
    onNavigate={setActive}
  />
}
{active==='analyze'&&<div className="two-col"><section className="panel"><div className="panel-head"><div><span className="eyebrow">MODEL INFERENCE</span><h2>Analyze DNA sequence</h2></div><Atom size={21}/></div><label className="field-label">Active trained model</label><select value={runName} onChange={e=>setRunName(e.target.value)}><option value="">{runs.length?'First available trained run':'No saved models yet'}</option>{runs.filter(r=>r.checkpoint_available).map(r=><option key={r.run_name} value={r.run_name}>{r.run_name} · {r.architecture}</option>)}</select><div className="inputhead"><label className="field-label">DNA sequence (A/C/G/T)</label><label className="upload"><FileUp size={15}/> Import FASTA<input accept=".fa,.fasta,.txt" type="file" onChange={upload}/></label></div><textarea spellCheck="false" placeholder="Paste your DNA sequence here..." value={sequence} onChange={e=>{
  setSequence(e.target.value.toUpperCase());
  setPrediction(null);
  setDynamicXAI(null);
  setError('');
  setXaiError('');
}}/><div className="helper"><span>{sequence.length.toLocaleString()} bases</span><span>GC {sequence?((sequence.match(/[GC]/g)||[]).length/sequence.replace(/\s/g,'').length*100).toFixed(1):'–'}%</span></div><button className="primary" onClick={analyze} disabled={!sequence.trim()||busy}>{busy?'Analyzing...':<><Play size={16}/> Run prediction</>}</button>{error&&<div className="error"><CircleAlert size={17}/>{error}</div>}</section><section className="panel"><div className="panel-head"><div><span className="eyebrow">PREDICTION RESULT</span><h2>Regulatory analysis</h2></div></div>{prediction?<><div className="result-big"><span>Predicted category</span><h3>{prediction.predicted_class}</h3><small>Model: {prediction.model} · {prediction.length} bp</small></div>{Object.entries(prediction.probabilities).map(([name,value])=><div className="prob" key={name}><div><b>{name}</b><span>{(value*100).toFixed(1)}%</span></div><div className="track"><div style={{width:`${value*100}%`}}/></div></div>)}<div className="caution">{prediction.warning}</div>
<button
  className="primary"
  onClick={explainPrediction}
  disabled={xaiBusy || !sequence.trim()}
>
  {xaiBusy ? 'Calculating explanation...' : 'Explain this prediction'}
</button>
{xaiError && <div className="error">{xaiError}</div>}
</>:<div className="empty"><Atom size={40}/><h3>No predictions yet</h3><p>Train a model and enter a DNA sequence of the checkpoint's expected length to generate research predictions.</p></div>}</section></div>}
 
{active==='analyze' && dynamicXAI && (
  <div className="panel xai-full-width">
    <h2>Nucleotide Attribution</h2>
    <p className="muted">
      Integrated Gradients ? {dynamicXAI.data.length} DNA positions
    </p>
    <div className="chart tall">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dynamicXAI.data}>
          <CartesianGrid stroke="#e5e7f1" strokeDasharray="3 4"/>
          <XAxis dataKey="position" stroke="#64748b" interval={19}/>
          <YAxis stroke="#64748b"/>
          <Tooltip/>
          <Bar dataKey="attribution" fill="#7c3aed"/>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <p className="muted">{dynamicXAI.warning}</p>
  </div>
)}
{active==='experiments'&&<><section className="panel"><div className="panel-head"><div><span className="eyebrow">TRAINING RUNS</span><h2>Experiment history</h2></div><span className="pill">{runs.length} runs</span></div>{runs.length?<><div className="scrolltable"><table><thead><tr><th>Run</th><th>Architecture</th><th>Best val. macro-F1</th><th>Parameters</th><th>Runtime</th></tr></thead><tbody>{runs.map(r=><tr className={selected?.run_name===r.run_name?'selected':''} key={r.run_name} onClick={()=>setRunName(r.run_name)}><td><b>{r.run_name}</b></td><td>{r.architecture}</td><td>{Number(r.best_val_macro_f1).toFixed(3)}</td><td>{Number(r.parameters).toLocaleString()}</td><td>{r.duration_seconds}s</td></tr>)}</tbody></table></div></>:<EmptyRuns/>}</section>{selected&&<div className="two-col"><section className="panel"><h2>Learning curves</h2><p className="muted">Training and validation loss (actual saved run)</p><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={selected.history}><CartesianGrid stroke="#e5e7f1" strokeDasharray="3 4"/><XAxis dataKey="epoch" stroke="#64748b"/><YAxis stroke="#64748b"/><Tooltip contentStyle={{background:'#ffffff',border:'1px solid #ddd6fe'}}/><Legend/><Line type="monotone" dataKey="train_loss" stroke="#7c3aed" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="val_loss" stroke="#2563eb" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div></section><section className="panel"><h2>Experiment configuration</h2><div className="scrolltable">
  <table className="configuration-table">
    <tbody>
      {Object.entries({
        Architecture: selected.architecture,
        Parameters: selected.parameters,
        Device: selected.device,
        ...selected.config
      }).map(([key, value]) => (
        <tr key={key}>
          <td>
            <b>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</b>
          </td>
          <td>
            {typeof value === 'number'
              ? (key === 'parameters'
                  ? value.toLocaleString()
                  : String(value))
              : String(value ?? '?')}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div></section></div>}</>}
 {active==='models'&&<><LearningCurveComparison runs={runs}/><ArchitectureTable runs={runs}/>
<BenchmarkComparison/><div className="statgrid models-grid">{['cnn','bilstm','cnn_bilstm','transformer'].map((m,i)=><div className="panel model-card" key={m}><span className="architecture-num">0{i+1}</span><BrainCircuit size={24}/><h2>{['1D CNN','BiLSTM','CNN–BiLSTM','Transformer'][i]}</h2><p>{runs.filter(r=>r.architecture===m).length} recorded runs</p></div>)}</div><section className="panel"><h2>Best validation macro-F1 by run</h2>{runs.length?<div className="chart tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={runs
  .filter(r=>[
    'cnn_encode_baseline',
    'bilstm_encode_baseline',
    'cnn_bilstm_encode_baseline',
    'transformer_encode_baseline'
  ].includes(r.run_name))
  .map(r=>({
    name:{
      cnn:'CNN',
      bilstm:'BiLSTM',
      cnn_bilstm:'CNN-BiLSTM',
      transformer:'Transformer'
    }[r.architecture],
    f1:r.best_val_macro_f1
  }))}><CartesianGrid stroke="#e5e7f1" strokeDasharray="3 4"/><XAxis dataKey="name" stroke="#64748b"/><YAxis domain={[0,1]} stroke="#64748b"/><Tooltip contentStyle={{background:'#ffffff',border:'1px solid #ddd6fe'}}/><Bar dataKey="f1" fill="#7c3aed" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>:<EmptyRuns/>}</section></>}
 {active==='datasets'&&<div className="two-col"><section className="panel"><span className="eyebrow">PUBLIC GENOMIC RESOURCE</span><h2>ENCODE SCREEN</h2><p>The intended research data consist of human cCRE BED annotations on GRCh38. Reference DNA windows are extracted from UCSC's hg38 FASTA. Three provisional cCRE classes are used for classification.</p><div className="steps">{[['PLS','Promoter-like signatures'],['dELS','Distal enhancer-like signatures'],['CA-CTCF','Accessible CTCF-associated elements']].map(x=><div className="step" key={x[0]}><span>{x[0]}</span><div><b>{x[1]}</b><small>Official genomic annotations</small></div></div>)}</div><a className="primary linkbutton" href="https://screen.wenglab.org/downloads" target="_blank" rel="noreferrer">Open ENCODE downloads <ChevronRight size={16}/></a></section><section className="panel"><span className="eyebrow">METHODOLOGY</span><h2>Validation and limitations</h2><div className="steps">{[['01','Chromosome-aware splits','chr8 validation; chr9 test; other autosomes train'],['02','Overlap filtering','Remove cross-class overlapping fixed-length windows'],['03','Model selection','Use validation performance before touching test'],['04','Scientific limitations','cCRE labels include genomic and experimental evidence']].map(x=><div className="step" key={x[0]}><span>{x[0]}</span><div><b>{x[1]}</b><small>{x[2]}</small></div></div>)}</div></section></div>}
 {active==='evaluation'&&<FinalEvaluation/>}
 {active==='xai'&&<ExplainableAI/>}
  <footer>REGULAAI RESEARCH PLATFORM <span>Prototype · No clinical or validated genomic interpretation</span></footer></div></main></div>
}
function Stat({title,value,subtitle,icon:Icon}){return <div className="stat"><div><span>{title}</span><Icon size={19}/></div><strong>{value}</strong><small>{subtitle}</small></div>}
function EmptyRuns(){return <div className="empty"><ChartNoAxesCombined size={35}/><h3>No experiments recorded</h3><p>Generate demo data and train a model. Saved training results will appear here automatically.</p><code>python -m regulaai.train --model cnn</code></div>}
createRoot(document.getElementById('root')).render(<App/>);
