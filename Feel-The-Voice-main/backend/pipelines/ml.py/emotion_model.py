import torch
import torch.nn as nn

class EmotionModel(nn.Module):
    def __init__(self, n_features=122, n_classes=8):
        super().__init__()

        self.cnn = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=(3,3), padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d((2,2)),
            nn.Dropout(0.25),

            nn.Conv2d(32, 64, kernel_size=(3,3), padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d((2,2)),
            nn.Dropout(0.25),

            nn.Conv2d(64, 128, kernel_size=(3,3), padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((4, None)),
        )

        self.lstm = nn.LSTM(
            input_size=128 * 4,
            hidden_size=256,
            num_layers=2,
            batch_first=True,
            bidirectional=True,
            dropout=0.3
        )

        self.attention = nn.Linear(512, 1)

        self.classifier = nn.Sequential(
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(256, n_classes)
        )

    def forward(self, x):
        x = x.unsqueeze(1)
        x = self.cnn(x)
        b, c, h, t = x.shape
        x = x.permute(0, 3, 1, 2)
        x = x.reshape(b, t, c * h)
        x, _ = self.lstm(x)
        attn = torch.softmax(self.attention(x), dim=1)
        x = (x * attn).sum(dim=1)
        return self.classifier(x)