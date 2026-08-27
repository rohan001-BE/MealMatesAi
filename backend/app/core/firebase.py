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

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    cred_path = os.path.join(base_dir, settings.FIREBASE_CREDENTIALS_PATH)
    
    if not os.path.exists(cred_path):
        # Fallback check directly
        cred_path = settings.FIREBASE_CREDENTIALS_PATH

    if not os.path.exists(cred_path):
        raise FileNotFoundError(f"Firebase service account key not found at {cred_path}")

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
