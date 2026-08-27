import os
from typing import Dict, Any, Optional
import joblib

class ModelLoader:
    _instance: Optional["ModelLoader"] = None
    _bundle: Optional[Dict[str, Any]] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
        return cls._instance

    def load_model(self, model_path: Optional[str] = None) -> Dict[str, Any]:
        if self._bundle is not None:
            return self._bundle

        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            model_path = os.path.join(base_dir, "models", "meal_mate_recommender.joblib")

        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model bundle not found at {model_path}. Run 'python training/train.py' first."
            )

        print(f"[ModelLoader] Loading ML Model from: {model_path}")
        self._bundle = joblib.load(model_path)
        print(f"[ModelLoader] ML Model loaded successfully (Version: {self._bundle.get('model_version', 'v1')})")
        return self._bundle

    @property
    def bundle(self) -> Dict[str, Any]:
        if self._bundle is None:
            return self.load_model()
        return self._bundle

model_loader = ModelLoader()
