````
# 🫁 PneumoScan-Smart-Pneumonia-Detection

A deep learning–based web application for automated detection of **Pneumonia** from chest X-ray images.  
This project implements an end-to-end pipeline—from model training to real-time inference—using a fine-tuned ResNet18 architecture.

---

## Overview

Early detection of pneumonia is critical in clinical settings. This project leverages transfer learning to build an efficient and accurate classification model capable of assisting in preliminary screening.

The application is deployed using Streamlit, enabling users to upload X-ray images and receive instant predictions.

---

## Key Features

- Binary classification: **Normal vs Pneumonia**
- Real-time predictions via web interface
- Transfer learning using pretrained ResNet18
- Lightweight and responsive UI with Streamlit
- Modular code structure for scalability

---

## Model Architecture

- Backbone: ResNet18 (pretrained on ImageNet)
- Technique: Transfer Learning
- Final Layer: Fully connected layer adapted for 2 classes
- Loss Function: CrossEntropyLoss
- Optimizer: Adam

---

## Performance

| Metric                | Value  |
|----------------------|--------|
| Accuracy             | ~95%   |
| Recall (Pneumonia)   | ~96%   |
| False Negatives      | 32     |

> Emphasis is placed on high recall to minimize missed pneumonia cases, which is crucial in medical diagnosis.

---

## Application Interface

![Screenshot](./screenshot.png)

---

## Installation

```bash
git clone https://github.com/samiaabid06/PneumoScan-Smart-Pneumonia-Detection.git
cd PneumoScan-Smart-Pneumonia-Detection

pip install -r requirements.txt
streamlit run app.py
````

---

## Project Structure

```
pneumonia-detection-xray-ai/
│
├── app.py               # Streamlit application
├── src/                 # Model and preprocessing modules
├── train.py             # Training pipeline
├── requirements.txt
├── README.md
└── screenshot.png
```

---

## Dataset

* Source: Kaggle Chest X-ray Dataset
* Not included due to size limitations

---

## Notes

* Pretrained model weights (`.pth`) are not included
* To train the model locally:

```bash
python train.py
```

---

## Future Work

* Improve model generalization across diverse datasets
* Integrate confidence scoring for predictions
* Add explainability (e.g., Grad-CAM visualization)

---

## Learnings

* Practical implementation of transfer learning
* Handling class imbalance and evaluation metrics in healthcare AI
* Building and deploying ML-powered web applications

---

## Author

**Samia Abid**
[https://github.com/samiaabid06](https://github.com/samiaabid06)

```

---



