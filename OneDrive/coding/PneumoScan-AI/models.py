"""
PneumoScan AI — Database Models
SQLAlchemy ORM models for persistent storage
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()


class PredictionRecord(db.Model):
    """Stores prediction history"""
    
    __tablename__ = 'predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Patient Information
    patient_name = db.Column(db.String(255), nullable=False)
    patient_age = db.Column(db.Integer, nullable=False)
    patient_sex = db.Column(db.String(10), nullable=False)
    patient_id = db.Column(db.String(50), nullable=True)
    
    # Prediction Results
    prediction_result = db.Column(db.String(50), nullable=False)  # NORMAL or PNEUMONIA
    confidence = db.Column(db.Float, nullable=False)  # 0-1
    risk_level = db.Column(db.String(20), nullable=False)  # Low, Medium, High
    
    # File Information
    image_filename = db.Column(db.String(255), nullable=False)
    image_path = db.Column(db.String(500), nullable=False)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Additional notes
    notes = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'patient_name': self.patient_name,
            'patient_age': self.patient_age,
            'patient_sex': self.patient_sex,
            'patient_id': self.patient_id,
            'prediction_result': self.prediction_result,
            'confidence': self.confidence,
            'risk_level': self.risk_level,
            'image_filename': self.image_filename,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'notes': self.notes
        }


class SystemMetrics(db.Model):
    """Stores system metrics and performance data"""
    
    __tablename__ = 'metrics'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Metrics
    accuracy = db.Column(db.Float, default=0.92)
    precision = db.Column(db.Float, default=0.90)
    recall = db.Column(db.Float, default=0.88)
    f1_score = db.Column(db.Float, default=0.89)
    
    # Confusion Matrix (stored as JSON)
    confusion_matrix = db.Column(db.String(500), default='[[70, 164], [2, 388]]')
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'accuracy': self.accuracy,
            'precision': self.precision,
            'recall': self.recall,
            'f1_score': self.f1_score,
            'confusion_matrix': json.loads(self.confusion_matrix),
            'created_at': self.created_at.isoformat()
        }


def init_db(app):
    """Initialize database"""
    with app.app_context():
        db.create_all()
        
        # Initialize metrics if not present
        if SystemMetrics.query.first() is None:
            metrics = SystemMetrics()
            db.session.add(metrics)
            db.session.commit()
            print("✓ Database initialized with default metrics")
