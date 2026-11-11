"""DNA encoding and CSV datasets."""
import csv
import numpy as np
from torch.utils.data import Dataset

BASES='ACGT'

def encode(sequence, expected_length=None):
    s=sequence.strip().upper()
    if not s or any(c not in BASES for c in s):
        raise ValueError('DNA must contain only A, C, G, T and cannot be empty')
    if expected_length is not None and len(s)!=expected_length:
        raise ValueError(f'Expected {expected_length} bases, got {len(s)}')
    arr=np.zeros((len(s),4),dtype=np.float32)
    for i,c in enumerate(s): arr[i,BASES.index(c)]=1.
    return arr

class DNACSV(Dataset):
    def __init__(self,path,labels=('PLS','dELS','CA-CTCF'),expected_length=None):
        with open(path,newline='',encoding='utf8') as f: self.rows=list(csv.DictReader(f))
        self.labels=list(labels)
        if not self.rows: raise ValueError('Empty dataset')
        self.length=expected_length or len(self.rows[0]['sequence'])
    def __len__(self): return len(self.rows)
    def __getitem__(self,index):
        import torch
        row=self.rows[index]
        return torch.from_numpy(encode(row['sequence'],self.length)), self.labels.index(row['label'])
