from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class RecipeCreateRequest(BaseModel):
    recipeName: str = Field(..., min_length=2, description="Recipe title")
    calories: float = Field(..., gt=0, description="Calorie amount (kcal)")
    protein: float = Field(0.0, ge=0)
    carbs: float = Field(0.0, ge=0)
    fat: float = Field(0.0, ge=0)
    fiber: Optional[float] = 0.0
    sodium: Optional[float] = 0.0
    cholesterol: Optional[float] = 0.0
    preparationTime: int = Field(15, ge=1, description="Preparation time in minutes")
    serves: int = Field(1, ge=1, description="Number of servings")
    mealType: str = Field(..., description="'breakfast', 'lunch', 'dinner', 'snack'")
    dietaryType: str = Field(..., description="'desi', 'keto', 'vegetarian', 'vegan', 'non_vegetarian', 'mediterranean'")
    weightGoal: Optional[str] = "weight_loss"
    ingredients: List[Any] = Field(default_factory=list)
    instructions: List[str] = Field(default_factory=list)
    restrictions: List[str] = Field(default_factory=list)
    mealImageURL: Optional[str] = ""

class RecipeListResponse(BaseModel):
    success: bool = True
    count: int
    total: int
    page: int = 1
    totalPages: int = 1
    recipes: List[Dict[str, Any]]
