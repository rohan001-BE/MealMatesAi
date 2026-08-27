from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class UserSignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30, description="Unique username")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)")

class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")

class GoogleAuthRequest(BaseModel):
    idToken: Optional[str] = Field(None, description="Firebase/Google ID Token")
    email: EmailStr = Field(..., description="Google email address")
    displayName: Optional[str] = Field(None, description="User full name or display name")
    photoURL: Optional[str] = Field(None, description="Google profile avatar photo URL")

class UserOut(BaseModel):
    id: str
    username: str
    email: str
    profileImage: Optional[str] = ""
    isGoogleUser: bool = False
    createdAt: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool = True
    message: str
    token: str
    user: UserOut
