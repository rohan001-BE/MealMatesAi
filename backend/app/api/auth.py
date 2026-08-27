from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from app.schemas.auth import UserSignupRequest, UserLoginRequest, GoogleAuthRequest, AuthResponse, UserOut
from app.services.auth_service import auth_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication & Accounts"])

@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED, summary="Email & Password Registration")
def signup(request: UserSignupRequest):
    """
    Registers a new user account with email, username, and hashed password.
    Returns signed JWT access token and user object.
    """
    return auth_service.signup(request)

@router.post("/login", response_model=AuthResponse, status_code=status.HTTP_200_OK, summary="Email & Password Login")
def login(request: UserLoginRequest):
    """
    Authenticates registered users with email and password.
    Returns signed JWT access token.
    """
    return auth_service.login(request)

@router.post("/google", response_model=AuthResponse, status_code=status.HTTP_200_OK, summary="Google Sign-In / Sign-Up")
def google_auth(request: GoogleAuthRequest):
    """
    Authenticates or signs up users via Google OAuth / Firebase Google ID Token.
    Automatically syncs and saves Google profile photo and details.
    """
    return auth_service.google_auth(request)

@router.get("/me", response_model=UserOut, summary="Get Current Authenticated User")
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns profile information for the authenticated user from bearer token.
    """
    return UserOut(
        id=current_user["id"],
        username=current_user.get("username", ""),
        email=current_user.get("email", ""),
        profileImage=current_user.get("profileImage", ""),
        isGoogleUser=current_user.get("isGoogleUser", False),
        createdAt=current_user.get("createdAt")
    )
