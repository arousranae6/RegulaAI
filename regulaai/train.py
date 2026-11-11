"""Reproducible PyTorch training, validation-based selection and JSON logs."""
import argparse,json,random,time
from pathlib import Path
import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader
from sklearn.metrics import f1_score,accuracy_score
from .data import DNACSV
from .models import create_model
LABELS=['PLS','dELS','CA-CTCF']

def evaluate(model,loader,device):
    model.eval();labels=[];pred=[];loss_total=0
    with torch.no_grad():
        for x,y in loader:
            x=x.to(device);y=y.to(device)
            logits=model(x);loss_total+=nn.functional.cross_entropy(logits,y,reduction='sum').item()
            labels.extend(y.cpu().tolist());pred.extend(logits.argmax(-1).cpu().tolist())
    return {'loss':round(loss_total/len(labels),5),'accuracy':round(accuracy_score(labels,pred),5),
            'macro_f1':round(f1_score(labels,pred,average='macro',zero_division=0),5)}

def main(args):
    torch.manual_seed(args.seed);np.random.seed(args.seed);random.seed(args.seed)
    device=torch.device('cuda' if torch.cuda.is_available() and args.device!='cpu' else 'cpu')
    base=Path(args.data)
    train=DNACSV(base/'train.csv',expected_length=args.length)
    val=DNACSV(base/'val.csv',expected_length=args.length)
    kwargs={'dropout':args.dropout}
    if args.model in ('cnn','cnn_bilstm'):kwargs['kernel_size']=args.kernel_size
    if args.model in ('bilstm','cnn_bilstm'):kwargs['hidden_size']=args.hidden_size
    if args.model=='transformer':kwargs.update({'nhead':args.heads,'d_model':args.d_model,'max_length':args.length})
    model=create_model(args.model,num_classes=len(LABELS),**kwargs).to(device)
    train_loader=DataLoader(train,batch_size=args.batch_size,shuffle=True,num_workers=0)
    val_loader=DataLoader(val,batch_size=args.batch_size,shuffle=False,num_workers=0)
    opt=torch.optim.AdamW(model.parameters(),lr=args.lr,weight_decay=args.weight_decay)
    out=Path(args.out)/args.run_name;out.mkdir(parents=True,exist_ok=True)
    history=[];best=-1;start=time.perf_counter()
    for epoch in range(1,args.epochs+1):
        model.train();total=0;seen=0
        for x,y in train_loader:
            x=x.to(device);y=y.to(device);opt.zero_grad(set_to_none=True)
            loss=nn.functional.cross_entropy(model(x),y);loss.backward();opt.step()
            total+=loss.item()*len(y);seen+=len(y)
        row={'epoch':epoch,'train_loss':round(total/seen,5),**{f'val_{k}':v for k,v in evaluate(model,val_loader,device).items()}}
        history.append(row);print(row,flush=True)
        if row['val_macro_f1']>best:
            best=row['val_macro_f1']
            torch.save({'state_dict':model.state_dict(),'name':args.model,'kwargs':kwargs,
                        'length':args.length,'labels':LABELS,'best_val_macro_f1':best},out/'best.pt')
    meta={'run_name':args.run_name,'architecture':args.model,'device':str(device),'parameters':sum(p.numel() for p in model.parameters()),
          'duration_seconds':round(time.perf_counter()-start,2),'best_val_macro_f1':best,'config':vars(args),
          'history':history,'data_source':str(base),'label_scheme':'ENCODE-like names; validate actual source'}
    (out/'metrics.json').write_text(json.dumps(meta,indent=2),encoding='utf8')
    print(f'Saved checkpoint and metrics to {out}')

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--data',default='data/demo');p.add_argument('--out',default='artifacts');p.add_argument('--run-name',default='cnn_baseline')
    p.add_argument('--model',choices=['cnn','bilstm','cnn_bilstm','transformer'],default='cnn')
    p.add_argument('--length',type=int,default=200);p.add_argument('--epochs',type=int,default=4);p.add_argument('--batch-size',type=int,default=32)
    p.add_argument('--lr',type=float,default=0.001);p.add_argument('--dropout',type=float,default=0.2)
    p.add_argument('--kernel-size',type=int,default=7);p.add_argument('--hidden-size',type=int,default=128)
    p.add_argument('--heads',type=int,default=4);p.add_argument('--d-model',type=int,default=64)
    p.add_argument('--weight-decay',type=float,default=0.0001);p.add_argument('--seed',type=int,default=42)
    p.add_argument('--device',choices=['auto','cpu'],default='auto')
    main(p.parse_args())
