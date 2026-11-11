"""Evaluate a frozen checkpoint on a held-out test partition, once per final selection."""
import argparse,json
from pathlib import Path
import torch
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report,confusion_matrix,roc_auc_score,average_precision_score
import numpy as np
from .data import DNACSV
from .models import create_model

def load_checkpoint(path):
    checkpoint=torch.load(path,map_location='cpu',weights_only=True)
    model=create_model(checkpoint['name'],num_classes=len(checkpoint['labels']),**checkpoint['kwargs'])
    model.load_state_dict(checkpoint['state_dict']);model.eval()
    return model,checkpoint

def main(args):
    model,ckpt=load_checkpoint(args.checkpoint)
    ds=DNACSV(Path(args.data)/'test.csv',labels=ckpt['labels'],expected_length=ckpt['length'])
    loader=DataLoader(ds,batch_size=64)
    truths=[];scores=[]
    with torch.no_grad():
        for x,y in loader:
            truths.extend(y.tolist());scores.extend(torch.softmax(model(x),-1).tolist())
    scores=np.array(scores);pred=scores.argmax(1)
    report=classification_report(truths,pred,target_names=ckpt['labels'],zero_division=0,output_dict=True,labels=list(range(len(ckpt['labels']))))
    result={'classification_report':report,'confusion_matrix':confusion_matrix(truths,pred,labels=list(range(len(ckpt['labels'])))).tolist()}
    try:
        result['macro_auroc']=float(roc_auc_score(truths,scores,multi_class='ovr',labels=list(range(len(ckpt['labels'])))))
        result['macro_auprc']=float(np.mean([average_precision_score(np.array(truths)==i,scores[:,i]) for i in range(len(ckpt['labels']))]))
    except ValueError: result['note']='Missing classes in test data; AUC not available'
    dest=Path(args.checkpoint).parent/'test_results.json';dest.write_text(json.dumps(result,indent=2))
    print(json.dumps(result,indent=2))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--checkpoint',required=True);p.add_argument('--data',default='data/demo');main(p.parse_args())
