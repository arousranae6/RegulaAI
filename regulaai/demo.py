"""Synthetic dataset for SOFTWARE TESTING only. Not valid biological evidence."""
import argparse,csv,random
from pathlib import Path

def run(output='data/demo',length=200,count=180,seed=42):
    rng=random.Random(seed);out=Path(output);out.mkdir(parents=True,exist_ok=True)
    patterns={'PLS':'TATAAA','dELS':'CACGTG','CA-CTCF':'CCGCGG'}
    records=[]
    for name,motif in patterns.items():
        for i in range(count):
            seq=[rng.choice('ACGT') for _ in range(length)]
            pos=rng.randrange(15,length-len(motif)-15)
            seq[pos:pos+len(motif)]=motif
            records.append((name,''.join(seq)))
    rng.shuffle(records)
    for split,items in [('train',records[:int(.7*len(records))]),('val',records[int(.7*len(records)):int(.85*len(records))]),('test',records[int(.85*len(records)):])]:
        with (out/f'{split}.csv').open('w',newline='',encoding='utf8') as f:
            w=csv.writer(f);w.writerow(['label','sequence']);w.writerows(items)
        print(split,len(items))
    print('WARNING: synthetic motifs and labels. NOT actual genomic/regulatory examples.')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',default='data/demo');p.add_argument('--length',type=int,default=200);p.add_argument('--count',type=int,default=180)
    run(**vars(p.parse_args()))
