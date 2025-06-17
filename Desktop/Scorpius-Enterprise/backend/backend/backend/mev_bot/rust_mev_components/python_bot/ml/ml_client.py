import logging
from joblib import load
import numpy as np

class MLClient:
    def __init__(self, enabled=True, model_path="model_161.joblib"):
        self.enabled = enabled
        if self.enabled:
            try:
                self.model = load(model_path)
                logging.info(f"MLClient loaded model from {model_path}")
            except Exception as e:
                logging.error(f"Failed to load model: {e}")
                self.model = None

    def predict(self, features):
        if not self.enabled or not self.model:
            return 0.0
        try:
            features = np.array(features).reshape(1, -1)
            proba = self.model.predict_proba(features)
            return float(max(proba[0]))
        except Exception as e:
            logging.error(f"Prediction error: {e}")
            return 0.0
