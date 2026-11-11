"""FastAPI application. No checkpoint => demo interface has no predictions."""
from pathlib import Path
import json,os
from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel,Field
import torch
from regulaai.data import encode
from regulaai.models import create_model

app=FastAPI(title='RegulaAI API',version='0.1.0')
app.add_middleware(CORSMiddleware,allow_origins=['http://localhost:5173','http://127.0.0.1:5173'],allow_methods=['GET','POST'],allow_headers=['*'])
ROOT=Path(__file__).resolve().parents[1]

class SequenceInput(BaseModel):
    sequence:str=Field(min_length=1,max_length=10000)
    run_name:str|None=None

def get_artifacts():
    result=[]
    for file in sorted((ROOT/'artifacts').glob('*/metrics.json')):
        try:
            data=json.loads(file.read_text(encoding='utf8'))
            data['checkpoint_available']=(file.parent/'best.pt').exists()
            result.append(data)
        except (ValueError,OSError):continue
    return result

@app.get('/api/health')
def health():return {'status':'ok','project':'RegulaAI','version':'0.1.0'}

@app.get('/api/experiments')
def experiments():return {'runs':get_artifacts()}

@app.post('/api/predict')
def predict(body:SequenceInput):
    runs=[r for r in get_artifacts() if r['checkpoint_available']]
    if body.run_name:runs=[r for r in runs if r['run_name']==body.run_name]
    if not runs:raise HTTPException(409,'No trained checkpoint available. First train a model using the instructions in README.md.')
    run=runs[0]
    checkpoint_file=ROOT/'artifacts'/run['run_name']/'best.pt'
    try:
        ckpt=torch.load(checkpoint_file,map_location='cpu',weights_only=True)
        features=encode(body.sequence,ckpt['length'])
    except (ValueError,KeyError) as e:raise HTTPException(422,str(e)) from e
    model=create_model(ckpt['name'],num_classes=len(ckpt['labels']),**ckpt['kwargs'])
    model.load_state_dict(ckpt['state_dict']);model.eval()
    with torch.no_grad():probs=torch.softmax(model(torch.from_numpy(features)[None]),-1)[0].tolist()
    return {'model':ckpt['name'],'run_name':run['run_name'],'length':ckpt['length'],
            'predicted_class':ckpt['labels'][int(max(range(len(probs)),key=lambda i:probs[i]))],
            'probabilities':{name:round(float(prob),5) for name,prob in zip(ckpt['labels'],probs)},
            'data_source':run.get('data_source'),'warning':('SYNTHETIC DEMO MODEL — not biologically valid.'
              if 'demo' in str(run.get('data_source','')).lower() else 'Predictions are research estimates, not experimental proof of function.')}


@app.get('/api/test-results/{run_name}')
def test_results(run_name: str):
    if not run_name or not all(
        c.isalnum() or c in '_-' for c in run_name
    ):
        raise HTTPException(400, 'Invalid run name')

    path = ROOT / 'artifacts' / run_name / 'test_results.json'

    if not path.is_file():
        raise HTTPException(404, 'Test results not available')

    return json.loads(path.read_text(encoding='utf-8'))


@app.get('/api/xai/cnn')
def cnn_explanations():
    import csv

    file = ROOT / 'artifacts' / 'xai' / 'cnn_nucleotide_attributions.csv'

    if not file.is_file():
        raise HTTPException(404, 'XAI results not found')

    with file.open('r', encoding='utf-8', newline='') as f:
        rows = list(csv.DictReader(f))

    return {
        'model': 'cnn_encode_baseline',
        'method': 'Integrated Gradients',
        'baseline': 'Zero tensor',
        'data': [
            {
                'position': int(row['position']),
                'nucleotide': row['nucleotide'],
                'attribution': float(row['attribution'])
            }
            for row in rows
        ],
        'warning': 'Attributions explain the model prediction, not proven biological function.'
    }


@app.post('/api/xai/explain')
def explain_sequence(body: SequenceInput):
    from captum.attr import IntegratedGradients

    # Use the trained ENCODE CNN only
    run_name = 'cnn_encode_baseline'

    if body.run_name and body.run_name != run_name:
        raise HTTPException(
            422,
            'Dynamic explanations currently support cnn_encode_baseline only.'
        )

    checkpoint_path = (
        ROOT / 'artifacts' / run_name / 'best.pt'
    )

    if not checkpoint_path.is_file():
        raise HTTPException(
            404,
            'Trained CNN checkpoint not found.'
        )

    ckpt = torch.load(
        checkpoint_path,
        map_location='cpu',
        weights_only=True
    )

    try:
        sequence = ''.join(body.sequence.split()).upper()
        features = encode(sequence, ckpt['length'])
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc

    model = create_model(
        ckpt['name'],
        num_classes=len(ckpt['labels']),
        **ckpt['kwargs']
    )

    model.load_state_dict(ckpt['state_dict'])
    model.eval()

    x = torch.from_numpy(features).unsqueeze(0).float()

    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=1)[0]
        predicted_idx = int(probs.argmax().item())

    ig = IntegratedGradients(model)

    attributions, delta = ig.attribute(
        inputs=x,
        baselines=torch.zeros_like(x),
        target=predicted_idx,
        n_steps=100,
        return_convergence_delta=True
    )

    # Only the nucleotide actually present at each position
    scores = (
        attributions.detach().cpu().numpy()[0]
        * x.detach().cpu().numpy()[0]
    ).sum(axis=1)

    return {
        'model': ckpt['name'],
        'run_name': run_name,
        'length': int(ckpt['length']),
        'predicted_class': ckpt['labels'][predicted_idx],
        'probabilities': {
            label: round(float(prob), 6)
            for label, prob in zip(
                ckpt['labels'],
                probs.tolist()
            )
        },
        'method': 'Integrated Gradients',
        'baseline': 'Zero tensor',
        'convergence_delta': float(delta.item()),
        'data': [
            {
                'position': i + 1,
                'nucleotide': base,
                'attribution': float(scores[i])
            }
            for i, base in enumerate(sequence)
        ],
        'warning': (
            'Attributions explain the model prediction relative '
            'to the chosen baseline, not proven biological function.'
        )
    }


@app.get('/api/benchmark')
def benchmark_results():
    import csv

    file = ROOT / 'artifacts' / 'benchmark' / 'computational_benchmark.csv'

    if not file.is_file():
        raise HTTPException(404, 'Benchmark results not found')

    with file.open('r', encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))

    return {
        'device': 'CPU',
        'batch_size': 32,
        'results': [
            {
                'architecture': row['Architecture'],
                'run_name': row['Run'],
                'parameters': int(row['Parameters']),
                'latency_ms': float(row['Batch Latency (ms)']),
                'throughput': float(row['Throughput (seq/s)']),
                'validation_macro_f1': float(row['Validation Macro-F1'])
            }
            for row in rows
        ]
    }
