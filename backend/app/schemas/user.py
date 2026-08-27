from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class CalorieCalculationRequest(BaseModel):
    gender: str = Field("male", description="'male' or 'female'")
    age: int = Field(..., ge=10, le=100, description="Age in years")
    weight: float = Field(..., ge=30, le=300, description="Weight in kg")
    height: float = Field(..., ge=100, le=250, description="Height in cm")
    activityLevel: str = Field("moderate", description="'sedentary', 'light', 'moderate', 'active', 'very_active'")
    weightGoal: str = Field("weight_loss", description="'weight_loss', 'weight_gain', 'maintenance'")

class UserProfileUpdateRequest(BaseModel):
    username: Optional[str] = None
    age: Optional[int] = Field(None, ge=10, le=100)
    weight: Optional[float] = Field(None, ge=30, le=300)
    height: Optional[float] = Field(None, ge=100, le=250)
    gender: Optional[str] = None
    activityLevel: Optional[str] = None
    weightGoal: Optional[str] = None
    dietaryType: Optional[str] = None
    mealType: Optional[List[str]] = None
    profileImage: Optional[str] = None

class UserProfileResponse(BaseModel):
    success: bool = True
    message: str = "Profile retrieved successfully"
    user: Dict[str, Any]
    profile: Dict[str, Any]
    dailyCalories: Optional[float] = None
