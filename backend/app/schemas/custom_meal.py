from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class NutrientTarget(BaseModel):
    type: str = Field(..., description="'protein', 'carbs', 'fats', 'fiber', 'sodium', 'cholesterol'")
    value: float = Field(..., gt=0, description="Target nutrient value in grams/mg")

class CustomNutrientSearchRequest(BaseModel):
    calories: float = Field(..., gt=50, description="Target calorie amount (e.g. 500)")
    nutrient: NutrientTarget
    save: bool = Field(True, description="Whether to save this meal into user's profile customMeals")
