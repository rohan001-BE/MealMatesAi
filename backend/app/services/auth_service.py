import datetime
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from google.cloud.firestore import FieldFilter
from firebase_admin import auth as admin_auth
from app.core.firebase import db
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import UserSignupRequest, UserLoginRequest, GoogleAuthRequest, AuthResponse, UserOut

class AuthService:
    def __init__(self):
        self.users_ref = db.collection("users")

    def signup(self, req: UserSignupRequest) -> AuthResponse:
        email_clean = req.email.strip().lower()
        username_clean = req.username.strip()

        # Check if email exists in Firestore (check both lowercase and exact)
        email_query = self.users_ref.where(filter=FieldFilter("email", "==", email_clean)).limit(1).get()
        if len(email_query) == 0:
            email_query = self.users_ref.where(filter=FieldFilter("email", "==", req.email.strip())).limit(1).get()

        if len(email_query) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists. Please sign in instead."
            )

        # Check if username exists
        user_query = self.users_ref.where(filter=FieldFilter("username", "==", username_clean)).limit(1).get()
        if len(user_query) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken. Please choose another."
            )

        # 1. Synchronize User directly into Firebase Authentication
        firebase_uid = None
        try:
            fb_user = admin_auth.create_user(
                email=email_clean,
                password=req.password,
                display_name=username_clean
            )
            firebase_uid = fb_user.uid
            print(f"[Auth] Successfully registered user in Firebase Authentication with UID: {firebase_uid}")
        except Exception as fb_err:
            print(f"[Auth] Firebase Auth sync notice: {fb_err}")
            try:
                existing_fb_user = admin_auth.get_user_by_email(email_clean)
                firebase_uid = existing_fb_user.uid
            except Exception:
                pass

        hashed_pwd = hash_password(req.password)
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

        new_user_data = {
            "username": username_clean,
            "email": email_clean,
            "passwordHash": hashed_pwd,
            "profileImage": "",
            "isGoogleUser": False,
            "firebaseUid": firebase_uid,
            "createdAt": now_str,
            "updatedAt": now_str,
            "age": None,
            "gender": None,
            "weight": None,
            "height": None,
            "activityLevel": "moderate",
            "weightGoal": "weight_loss",
            "dietaryType": "balanced",
            "mealType": ["breakfast", "lunch", "dinner"],
            "dailyCalories": None,
            "customMeals": []
        }

        # 2. Save User Document to Cloud Firestore
        if firebase_uid:
            doc_ref = self.users_ref.document(firebase_uid)
            user_id = firebase_uid
        else:
            doc_ref = self.users_ref.document()
            user_id = doc_ref.id

        doc_ref.set(new_user_data)

        token = create_access_token({"_id": user_id, "email": email_clean, "username": username_clean})

        user_out = UserOut(
            id=user_id,
            username=username_clean,
            email=email_clean,
            profileImage="",
            isGoogleUser=False,
            createdAt=now_str
        )

        return AuthResponse(
            success=True,
            message="User registered successfully in Firebase & Firestore.",
            token=token,
            user=user_out
        )

    def login(self, req: UserLoginRequest) -> AuthResponse:
        input_identifier = req.email.strip()
        email_lower = input_identifier.lower()

        # Multi-strategy search: lowercase email, exact email, username
        query = self.users_ref.where(filter=FieldFilter("email", "==", email_lower)).limit(1).get()
        if len(query) == 0:
            query = self.users_ref.where(filter=FieldFilter("email", "==", input_identifier)).limit(1).get()
        if len(query) == 0:
            query = self.users_ref.where(filter=FieldFilter("username", "==", input_identifier)).limit(1).get()
        if len(query) == 0:
            query = self.users_ref.where(filter=FieldFilter("username", "==", email_lower)).limit(1).get()

        if len(query) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No account found with this email or username. Please create an account first."
            )

        user_doc = query[0]
        user_data = user_doc.to_dict()
        user_id = user_doc.id

        stored_hash = (
            user_data.get("passwordHash")
            or user_data.get("password")
            or user_data.get("hashed_password")
            or user_data.get("pwdHash")
            or ""
        )

        if not stored_hash:
            if user_data.get("isGoogleUser"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This account was registered with Google. Please click 'Continue with Google'."
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email or password."
            )

        is_valid = False

        # 1. Standard bcrypt check
        if stored_hash.startswith("$2"):
            is_valid = verify_password(req.password, stored_hash)
        # 2. Direct string equality (legacy plain text)
        elif stored_hash == req.password:
            is_valid = True
            try:
                # Upgrade to secure bcrypt hash
                user_doc.reference.update({"passwordHash": hash_password(req.password)})
            except Exception:
                pass
        # 3. Fallback passlib CryptContext
        else:
            try:
                from passlib.context import CryptContext
                pwd_ctx = CryptContext(schemes=["bcrypt", "pbkdf2_sha256", "sha256_crypt"], deprecated="auto")
                is_valid = pwd_ctx.verify(req.password, stored_hash)
            except Exception:
                is_valid = (stored_hash == req.password)

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect password. Please try again."
            )

        token = create_access_token({
            "_id": user_id,
            "email": user_data.get("email"),
            "username": user_data.get("username")
        })

        user_out = UserOut(
            id=user_id,
            username=user_data.get("username", ""),
            email=user_data.get("email", ""),
            profileImage=user_data.get("profileImage", ""),
            isGoogleUser=user_data.get("isGoogleUser", False),
            createdAt=user_data.get("createdAt")
        )

        return AuthResponse(
            success=True,
            message="Login successful.",
            token=token,
            user=user_out
        )

    def google_auth(self, req: GoogleAuthRequest) -> AuthResponse:
        email_clean = req.email.strip().lower()
        query = self.users_ref.where(filter=FieldFilter("email", "==", email_clean)).limit(1).get()
        if len(query) == 0:
            query = self.users_ref.where(filter=FieldFilter("email", "==", req.email.strip())).limit(1).get()

        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

        if len(query) > 0:
            # Existing user: update google avatar if none exists or updated
            user_doc = query[0]
            user_id = user_doc.id
            user_data = user_doc.to_dict()
            
            updates = {"updatedAt": now_str}
            if req.photoURL and (not user_data.get("profileImage") or user_data.get("isGoogleUser")):
                updates["profileImage"] = req.photoURL
            
            user_doc.reference.update(updates)
            user_data.update(updates)
        else:
            # Create new user for Google login
            base_username = req.displayName.replace(" ", "_").lower() if req.displayName else email_clean.split("@")[0]
            # Ensure unique username
            username = f"{base_username}_{datetime.datetime.now().strftime('%M%S')}"

            user_data = {
                "username": username,
                "email": email_clean,
                "passwordHash": "",
                "profileImage": req.photoURL or "",
                "isGoogleUser": True,
                "createdAt": now_str,
                "updatedAt": now_str,
                "age": None,
                "gender": None,
                "weight": None,
                "height": None,
                "activityLevel": "moderate",
                "weightGoal": "weight_loss",
                "dietaryType": "balanced",
                "mealType": ["breakfast", "lunch", "dinner"],
                "dailyCalories": None,
                "customMeals": []
            }

            doc_ref = self.users_ref.document()
            doc_ref.set(user_data)
            user_id = doc_ref.id

        token = create_access_token({
            "_id": user_id,
            "email": email_clean,
            "username": user_data.get("username", "")
        })

        user_out = UserOut(
            id=user_id,
            username=user_data.get("username", ""),
            email=email_clean,
            profileImage=user_data.get("profileImage", ""),
            isGoogleUser=True,
            createdAt=user_data.get("createdAt")
        )

        return AuthResponse(
            success=True,
            message="Google authentication successful.",
            token=token,
            user=user_out
        )

auth_service = AuthService()
