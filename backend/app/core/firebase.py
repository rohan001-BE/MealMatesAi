import os
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from app.core.config import settings

_firebase_app = None
_db = None

def init_firebase():
    global _firebase_app, _db
    if _firebase_app is not None:
        return _db

    # 1. Check if raw Firebase credentials JSON is provided via environment variable
    firebase_json_env = os.getenv("FIREBASE_CREDENTIALS_JSON") or getattr(settings, "FIREBASE_CREDENTIALS_JSON", None)
    if firebase_json_env and firebase_json_env.strip().startswith("{"):
        import json
        print("[Firebase] Initializing Firebase Admin SDK from environment JSON...")
        cred_dict = json.loads(firebase_json_env)
        cred = credentials.Certificate(cred_dict)
        _firebase_app = firebase_admin.initialize_app(cred)
        _db = firestore.client()
        print("[Firebase] Firebase Firestore Connected Successfully.")
        return _db

    # 2. Check credentials file path
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    cred_path = os.path.join(base_dir, settings.FIREBASE_CREDENTIALS_PATH)
    
    if not os.path.exists(cred_path):
        # Fallback check directly
        cred_path = settings.FIREBASE_CREDENTIALS_PATH

    if not os.path.exists(cred_path):
        raise FileNotFoundError(f"Firebase service account key not found at {cred_path}. Set FIREBASE_CREDENTIALS_JSON or place credential file.")

    print(f"[Firebase] Initializing Firebase Admin SDK with {cred_path}...")
    cred = credentials.Certificate(cred_path)
    _firebase_app = firebase_admin.initialize_app(cred)
    _db = firestore.client()
    print("[Firebase] Firebase Firestore Connected Successfully.")
    return _db

def get_db():
    global _db
    if _db is None:
        return init_firebase()
    return _db

db = get_db()
