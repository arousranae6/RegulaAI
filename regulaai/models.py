"""Four PyTorch models for fixed-length one-hot encoded DNA; input [B,L,4]."""
import torch
from torch import nn


class CNN(nn.Module):
    def __init__(self, num_classes=3, kernel_size=7, dropout=0.2, channels=64):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv1d(4, channels, kernel_size, padding=kernel_size//2), nn.BatchNorm1d(channels), nn.GELU(),
            nn.MaxPool1d(4), nn.Conv1d(channels, channels*2, 5, padding=2), nn.BatchNorm1d(channels*2),
            nn.GELU(), nn.AdaptiveMaxPool1d(1))
        self.head=nn.Sequential(nn.Flatten(), nn.Dropout(dropout), nn.Linear(channels*2,num_classes))
    def forward(self,x):
        return self.head(self.features(x.transpose(1,2)))


class BiLSTM(nn.Module):
    def __init__(self,num_classes=3,hidden_size=128,dropout=0.2, **kwargs):
        super().__init__()
        self.rnn=nn.LSTM(4,hidden_size,batch_first=True,bidirectional=True)
        self.head=nn.Sequential(nn.Dropout(dropout),nn.Linear(2*hidden_size,num_classes))
    def forward(self,x):
        out,_=self.rnn(x)
        return self.head(out.mean(dim=1))


class CNNBiLSTM(nn.Module):
    def __init__(self,num_classes=3,kernel_size=7,hidden_size=128,dropout=0.2):
        super().__init__()
        self.conv=nn.Sequential(nn.Conv1d(4,64,kernel_size,padding=kernel_size//2),nn.GELU(),nn.MaxPool1d(4))
        self.rnn=nn.LSTM(64,hidden_size,batch_first=True,bidirectional=True)
        self.head=nn.Sequential(nn.Dropout(dropout),nn.Linear(hidden_size*2,num_classes))
    def forward(self,x):
        x=self.conv(x.transpose(1,2)).transpose(1,2)
        x,_=self.rnn(x)
        return self.head(x.mean(dim=1))


class Transformer(nn.Module):
    def __init__(self,num_classes=3,d_model=64,nhead=4,layers=2,dropout=0.2,max_length=1000, **kwargs):
        super().__init__()
        assert d_model%nhead==0, 'd_model must be divisible by nhead'
        self.embedding=nn.Linear(4,d_model)
        self.position=nn.Embedding(max_length,d_model)
        layer=nn.TransformerEncoderLayer(d_model,nhead,dim_feedforward=d_model*4,
                                         dropout=dropout,batch_first=True,activation='gelu')
        self.encoder=nn.TransformerEncoder(layer,layers)
        self.head=nn.Sequential(nn.LayerNorm(d_model),nn.Dropout(dropout),nn.Linear(d_model,num_classes))
    def forward(self,x):
        if x.shape[1]>self.position.num_embeddings: raise ValueError('Input exceeds max_length')
        positions=torch.arange(x.shape[1],device=x.device)
        h=self.embedding(x)+self.position(positions)[None]
        return self.head(self.encoder(h).mean(dim=1))


def create_model(name, num_classes=3, **kwargs):
    models={'cnn':CNN,'bilstm':BiLSTM,'cnn_bilstm':CNNBiLSTM,'transformer':Transformer}
    if name not in models: raise ValueError(f'Model must be one of {list(models)}')
    return models[name](num_classes=num_classes,**kwargs)
