import torch
from torchvision import datasets, transforms
from torch import nn, optim
from tqdm import tqdm

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor()
])

train_data = datasets.ImageFolder("../data/chest_xray/train", transform=transform)
train_loader = torch.utils.data.DataLoader(train_data, batch_size=32, shuffle=True)

print("Classes:", train_data.classes)

model = nn.Sequential(
    nn.Conv2d(3, 32, 3), nn.ReLU(), nn.MaxPool2d(2),
    nn.Conv2d(32, 64, 3), nn.ReLU(), nn.MaxPool2d(2),
    nn.Flatten(),
    nn.Linear(64*14*14, 128), nn.ReLU(),
    nn.Linear(128, 1), nn.Sigmoid()
).to(device)

criterion = nn.BCELoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

epochs = 5

for epoch in range(epochs):
    model.train()
    total_loss = 0

    for images, labels in tqdm(train_loader):
        images = images.to(device)
        labels = labels.float().to(device)

        outputs = model(images).squeeze()
        loss = criterion(outputs, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    print(f"Epoch {epoch+1}, Loss: {total_loss:.4f}")

# 🔥 IMPORTANT (correct save)
torch.save(model.state_dict(), "../models/pneumonia_model.pth")

print("✅ Model saved successfully!")