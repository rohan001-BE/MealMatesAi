from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as firebase_auth
from app.core.security import decode_access_token
from app.core.firebase import db

security_bearer = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided."
        )

    token = credentials.credentials
    user_id = None

    # 1. Try decoding custom signed JWT
    payload = decode_access_token(token)
    if payload and "_id" in payload:
        user_id = payload["_id"]
    elif payload and "sub" in payload:
        user_id = payload["sub"]

    # 2. If not custom JWT, try verifying as Firebase ID Token
    if not user_id:
        try:
            decoded_firebase = firebase_auth.verify_id_token(token)
            user_id = decoded_firebase["uid"]
        except Exception:
            pass

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token."
        )

    # Fetch user from Firestore
    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found in database."
        )

    user_data = user_doc.to_dict()
    user_data["id"] = user_doc.id
    user_data["_id"] = user_doc.id
    return user_data

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Optional[Dict[str, Any]]:
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except Exception:
        return None
