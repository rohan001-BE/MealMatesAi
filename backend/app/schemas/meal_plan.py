from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.recommendation import RecipeItem

class MealPlanRequest(BaseModel):
    # Plan duration & structure
    days: int = Field(7, ge=1, le=14, description="Number of days to generate plan for (1-14)")
    mealsPerDay: int = Field(3, ge=1, le=5, description="Number of meals per day (1 to 5)")
    customMealTypes: Optional[List[str]] = Field(
        None,
        description="Explicit meal types order per day (e.g. ['breakfast', 'lunch', 'dinner'])"
    )

    # Nutritional targets (optional direct override)
    dailyCalories: Optional[float] = Field(None, ge=500, le=6000, description="Override target calories")
    protein: Optional[float] = Field(None, ge=10, le=400, description="Override target protein (g)")
    carbs: Optional[float] = Field(None, ge=0, le=800, description="Override target carbs (g)")
    fat: Optional[float] = Field(None, ge=5, le=300, description="Override target fats (g)")

    # User Profile (computed automatically if targets are omitted)
    gender: Optional[str] = Field("male", description="'male' or 'female'")
    age: Optional[int] = Field(25, ge=10, le=100)
    weight: Optional[float] = Field(70.0, ge=30, le=300, description="Weight in kg")
    height: Optional[float] = Field(175.0, ge=100, le=250, description="Height in cm")
    activityLevel: Optional[str] = Field("moderate", description="'sedentary', 'light', 'moderate', 'active', 'very_active'")
    weightGoal: Optional[str] = Field("weight_loss", description="'weight_loss', 'weight_gain', 'maintenance'")

    # Dietary & Safety constraints
    dietaryType: Optional[str] = Field("balanced", description="'keto', 'high_protein', 'low_carb', 'vegetarian', 'vegan', 'balanced'")
    allergies: Optional[List[str]] = Field(default_factory=list, description="Allergies to strictly exclude")
    dislikes: Optional[List[str]] = Field(default_factory=list, description="Disliked ingredients to exclude")
    restrictions: Optional[List[str]] = Field(default_factory=list, description="Dietary restrictions ('gluten_free', 'dairy_free', etc.)")

class DayPlan(BaseModel):
    day: int
    totalCalories: float
    totalProtein: float
    totalCarbs: float
    totalFat: float
    calorieDeviation: float
    optimizationScore: float
    meals: List[Dict[str, Any]]

class MealPlanResponse(BaseModel):
    status: str = "success"
    modelVersion: str
    targetCalories: float
    targetProtein: float
    targetCarbs: float
    targetFat: float
    daysCount: int
    days: List[DayPlan]
