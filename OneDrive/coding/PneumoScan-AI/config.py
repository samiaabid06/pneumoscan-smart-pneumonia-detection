"""
PneumoScan AI — Production Configuration
Loads settings from .env file
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration"""
    
    # Flask
    FLASK_ENV = os.getenv('FLASK_ENV', 'production')
    DEBUG = os.getenv('FLASK_DEBUG', 'False') == 'True'
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///pneumoscan.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # File Upload
    MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', '16777216'))  # 16MB
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', './uploads')
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'bmp'}
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5000').split(',')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', './logs/pneumoscan.log')
    
    # Model
    MODEL_PATH = os.getenv('MODEL_PATH', './models/pneumonia_model.pth')
    USE_CUDA = os.getenv('USE_CUDA', 'True') == 'True'
    
    # Demo Mode
    DEMO_MODE = os.getenv('DEMO_MODE', 'False') == 'True'
    
    @staticmethod
    def init_directories():
        """Create required directories if they don't exist"""
        Path(Config.UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)
        Path(Config.LOG_FILE).parent.mkdir(parents=True, exist_ok=True)
        Path('logs').mkdir(parents=True, exist_ok=True)


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    FLASK_ENV = 'development'


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    FLASK_ENV = 'production'


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


# Select config based on environment
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': ProductionConfig
}
