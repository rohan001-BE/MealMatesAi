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

    import json
    import base64

    # 1. Check all common environment variable names for JSON credentials
    env_keys = [
        "FIREBASE_CREDENTIALS_JSON",
        "FIREBASE_CREDENTIALS",
        "FIREBASE_SERVICE_ACCOUNT",
        "FIREBASE_ADMIN_JSON",
        "FIREBASE_KEY",
    ]
    raw_env_val = None
    for k in env_keys:
        val = os.getenv(k) or getattr(settings, k, None)
        if val and str(val).strip():
            raw_env_val = str(val).strip()
            break

    if raw_env_val:
        # Strip outer quotes if accidentally wrapped
        if (raw_env_val.startswith("'") and raw_env_val.endswith("'")) or (
            raw_env_val.startswith('"') and raw_env_val.endswith('"')
        ):
            raw_env_val = raw_env_val[1:-1].strip()

        # Handle Base64 encoded string if provided
        if not raw_env_val.startswith("{"):
            try:
                decoded = base64.b64decode(raw_env_val).decode("utf-8")
                if decoded.strip().startswith("{"):
                    raw_env_val = decoded.strip()
            except Exception:
                pass

        if raw_env_val.startswith("{"):
            try:
                print("[Firebase] Initializing Firebase Admin SDK from environment JSON string...")
                cred_dict = json.loads(raw_env_val)
                # Fix escaped newlines in private key if present
                if "private_key" in cred_dict and "\\n" in cred_dict["private_key"]:
                    cred_dict["private_key"] = cred_dict["private_key"].replace("\\n", "\n")
                cred = credentials.Certificate(cred_dict)
                _firebase_app = firebase_admin.initialize_app(cred)
                _db = firestore.client()
                print("[Firebase] Firebase Firestore Connected Successfully via Environment Variable.")
                return _db
            except Exception as e:
                print(f"[Firebase Warning] Failed to parse JSON from env: {e}")

    # 2. Check candidate credential file paths (including Render /etc/secrets/ paths)
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    candidate_paths = [
        os.path.join(base_dir, settings.FIREBASE_CREDENTIALS_PATH),
        settings.FIREBASE_CREDENTIALS_PATH,
        f"/etc/secrets/{settings.FIREBASE_CREDENTIALS_PATH}",
        f"/etc/secrets/{os.path.basename(settings.FIREBASE_CREDENTIALS_PATH)}",
        "/etc/secrets/firebase.json",
        "/etc/secrets/credentials.json",
        "/etc/secrets/service_account.json",
        os.path.join(base_dir, "meal-mates-16030-firebase-adminsdk-fbsvc-df26a0b29e.json"),
        os.path.join(base_dir, "firebase.json"),
    ]

    for cred_path in candidate_paths:
        if cred_path and os.path.exists(cred_path):
            try:
                print(f"[Firebase] Initializing Firebase Admin SDK with file: {cred_path}...")
                cred = credentials.Certificate(cred_path)
                _firebase_app = firebase_admin.initialize_app(cred)
                _db = firestore.client()
                print("[Firebase] Firebase Firestore Connected Successfully via File.")
                return _db
            except Exception as file_err:
                print(f"[Firebase Warning] Failed to initialize with {cred_path}: {file_err}")

    raise FileNotFoundError(
        f"Firebase credentials not found! Set the 'FIREBASE_CREDENTIALS_JSON' environment variable in your Render dashboard (paste your Firebase JSON), or upload a Secret File."
    )

def get_db():
    global _db
    if _db is None:
        return init_firebase()
    return _db

db = get_db()
