"""Extract fixed-length genomic windows from per-class BED files using hg38 FASTA.

Input files must correspond to the same assembly (GRCh38) and use BED 0-based coordinates.
Splits are chromosome-aware: chr8->val, chr9->test, other autosomes->train.
Overlapping windows are removed across classes BEFORE sampling. The registry class
labels are proxies based on biochemical evidence; sequence-only prediction has limits.
"""
import argparse
import csv
import random
from pathlib import Path

CLASSES=('PLS','dELS','CA-CTCF')

def read_bed(path,label):
    import gzip
    opener=gzip.open if str(path).endswith('.gz') else open
    with opener(path,'rt',encoding='utf8') as f:
        for line in f:
            if not line.strip() or line.startswith(('#','track','browser')): continue
            cols=line.strip().split('\t')
            if len(cols)<3: continue
            try: start,end=int(cols[1]),int(cols[2])
            except ValueError: continue
            if end>start and cols[0] in {f'chr{i}' for i in range(1,23)}:
                yield cols[0],start,end,label

def make_windows(records, window):
    for chrom,start,end,label in records:
        center=(start+end)//2
        left=center-window//2
        right=left+window
        if left>=0: yield chrom,left,right,label

def discard_overlaps(windows):
    """Drop every window belonging to any overlapping cluster within a chromosome."""
    items=sorted(windows,key=lambda x:(int(x[0][3:]),x[1],x[2]))
    kept=[];cluster=[];end=-1;chrom=None
    def flush():
        if len(cluster)==1: kept.append(cluster[0])
    for item in items:
        if item[0]!=chrom or item[1]>=end:
            flush();cluster=[item];chrom=item[0];end=item[2]
        else:
            cluster.append(item);end=max(end,item[2])
    flush()
    return kept

def run(args):
    try: from pyfaidx import Fasta
    except ImportError as exc: raise SystemExit('Install requirements first: pip install -r requirements.txt') from exc
    rng=random.Random(args.seed)
    records=[]
    for label,path in [('PLS',args.pls),('dELS',args.dels),('CA-CTCF',args.ctcf)]:
        records.extend(make_windows(read_bed(path,label),args.length))
    windows=discard_overlaps(records)
    genome=Fasta(args.fasta,as_raw=True,sequence_always_upper=True)
    partitions={'train':[],'val':[],'test':[]}
    for chrom,start,end,label in windows:
        part='val' if chrom=='chr8' else 'test' if chrom=='chr9' else 'train'
        try: seq=str(genome[chrom][start:end]).upper()
        except (KeyError,IndexError): continue
        if len(seq)!=args.length or set(seq)-set('ACGT'): continue
        partitions[part].append((chrom,start,end,label,seq))
    output=Path(args.output);output.mkdir(parents=True,exist_ok=True)
    for part,items in partitions.items():
        selected=[]
        for label in CLASSES:
            pool=[r for r in items if r[3]==label]
            rng.shuffle(pool)
            selected.extend(pool[:args.max_per_class] if args.max_per_class>0 else pool)
        rng.shuffle(selected)
        with (output/f'{part}.csv').open('w',newline='',encoding='utf8') as f:
            w=csv.writer(f);w.writerow(['chrom','start','end','label','sequence'])
            w.writerows(selected)
        print(f'{part}: {len(selected)} sequences; class counts: '+str({k:sum(r[3]==k for r in selected) for k in CLASSES}))
    print('IMPORTANT: chromosome splits may be imbalanced. Inspect distributions before training and report them.')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--pls',required=True,help='PLS BED or BED.gz')
    parser.add_argument('--dels',required=True,help='dELS BED or BED.gz')
    parser.add_argument('--ctcf',required=True,help='CA-CTCF BED or BED.gz')
    parser.add_argument('--fasta',required=True,help='Uncompressed hg38.fa')
    parser.add_argument('--output',default='data/processed')
    parser.add_argument('--length',type=int,default=200)
    parser.add_argument('--max-per-class',type=int,default=10000,help='per class per partition; 0=all')
    parser.add_argument('--seed',type=int,default=42)
    run(parser.parse_args())
