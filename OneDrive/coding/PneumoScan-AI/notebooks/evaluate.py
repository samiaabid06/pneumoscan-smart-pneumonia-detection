import torch
from torchvision import datasets, transforms
from torch import nn
from sklearn.metrics import confusion_matrix, classification_report
import matplotlib.pyplot as plt
import seaborn as sns
import json

# Device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Transform
transform = transforms.Compose([
    transforms.Resize((64,64)),
    transforms.ToTensor()
])

# Load Test Data
test_data = datasets.ImageFolder("../data/chest_xray/test", transform=transform)
test_loader = torch.utils.data.DataLoader(test_data, batch_size=32, num_workers=0)

# Recreate Model (same as training)
model = nn.Sequential(
    nn.Conv2d(3,32,3), nn.ReLU(), nn.MaxPool2d(2),
    nn.Conv2d(32,64,3), nn.ReLU(), nn.MaxPool2d(2),
    nn.Flatten(),
    nn.Linear(64*14*14,128), nn.ReLU(),
    nn.Linear(128,1), nn.Sigmoid()
).to(device)

# Load trained weights
model.load_state_dict(torch.load("../models/pneumonia_model.pth"))
model.eval()

# Predictions
y_true = []
y_pred = []

with torch.no_grad():
    for images, labels in test_loader:
        images = images.to(device)
        outputs = model(images).squeeze()
        preds = (outputs > 0.5).int().cpu().numpy()

        y_pred.extend(preds)
        y_true.extend(labels.numpy())

# Confusion Matrix
cm = confusion_matrix(y_true, y_pred)

# Plot
plt.figure(figsize=(5,4))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=["Normal","Pneumonia"],
            yticklabels=["Normal","Pneumonia"])
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion Matrix")

plt.savefig("../app/static/confusion.png")

# Classification Report
report = classification_report(y_true, y_pred, output_dict=True)

# Save Metrics
metrics = {
    "accuracy": report["accuracy"],
    "precision": report["1"]["precision"],
    "recall": report["1"]["recall"],
    "f1_score": report["1"]["f1-score"]
}

with open("../app/metrics.json", "w") as f:
    json.dump(metrics, f)

print("✅ Evaluation complete!")