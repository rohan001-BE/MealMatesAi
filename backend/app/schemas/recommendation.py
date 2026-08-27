from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RecommendationRequest(BaseModel):
    # Optional Direct Macro/Calorie Inputs
    dailyCalories: Optional[float] = Field(None, ge=500, le=6000, description="Target daily calorie requirement (kcal)")
    protein: Optional[float] = Field(None, ge=10, le=400, description="Target protein in grams")
    carbs: Optional[float] = Field(None, ge=0, le=800, description="Target carbohydrates in grams")
    fat: Optional[float] = Field(None, ge=5, le=300, description="Target fats in grams")

    # User Profile (if direct calories not provided, computed automatically)
    gender: Optional[str] = Field("male", description="Gender: 'male' or 'female'")
    age: Optional[int] = Field(25, ge=10, le=100, description="Age in years")
    weight: Optional[float] = Field(70.0, ge=30, le=300, description="Weight in kg")
    height: Optional[float] = Field(175.0, ge=100, le=250, description="Height in cm")
    activityLevel: Optional[str] = Field("moderate", description="'sedentary', 'light', 'moderate', 'active', 'very_active'")
    weightGoal: Optional[str] = Field("weight_loss", description="'weight_loss', 'weight_gain', 'maintenance'")

    # Dietary & Meal Filters
    mealType: Optional[str] = Field("lunch", description="'breakfast', 'lunch', 'dinner', 'snack'")
    dietaryType: Optional[str] = Field("balanced", description="'keto', 'high_protein', 'low_carb', 'vegetarian', 'vegan', 'balanced'")
    allergies: Optional[List[str]] = Field(default_factory=list, description="Allergies to strictly exclude (e.g. ['peanuts', 'shrimp'])")
    dislikes: Optional[List[str]] = Field(default_factory=list, description="Disliked ingredients (e.g. ['mushroom'])")
    restrictions: Optional[List[str]] = Field(default_factory=list, description="Dietary restrictions: ['gluten_free', 'nut_free', 'egg_free', 'lactose_free', 'dairy_free', 'low_carb', 'low_sugar']")
    topK: int = Field(10, ge=1, le=50, description="Number of candidate recipes to return")

class RecipeItem(BaseModel):
    id: str
    recipeName: str
    mealType: str
    dietaryType: str
    weightGoal: Optional[str] = None
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    sodium: Optional[float] = 0.0
    cholesterol: Optional[float] = 0.0
    preparationTime: int
    serves: int
    restrictions: List[str] = Field(default_factory=list)
    ingredients: List[Any] = Field(default_factory=list)
    instructions: List[str] = Field(default_factory=list)
    mealImageURL: Optional[str] = ""
    score: Optional[float] = Field(None, description="Similarity match score (0.0 to 1.0)")

class RecommendationResponse(BaseModel):
    status: str = "success"
    modelVersion: str
    count: int
    targetCalories: float
    targetProtein: float
    targetCarbs: float
    targetFat: float
    recommendations: List[RecipeItem]
