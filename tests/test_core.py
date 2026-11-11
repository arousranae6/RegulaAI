import pytest
import torch
from regulaai.data import encode
from regulaai.models import create_model

@pytest.mark.parametrize('name',['cnn','bilstm','cnn_bilstm','transformer'])
def test_architecture_forward(name):
    kw={'max_length':64} if name=='transformer' else {}
    model=create_model(name,num_classes=3,**kw)
    x=torch.from_numpy(encode('ACGT'*16))[None]
    assert model(x).shape==(1,3)

def test_encoding_rejects_ambiguous_bases():
    with pytest.raises(ValueError):encode('ACTN')

def test_encoding_onehot():
    x=encode('ACGT');assert x.shape==(4,4)
    assert (x.sum(axis=1)==1).all()
