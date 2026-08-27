from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query, status
from app.schemas.recipe import RecipeListResponse, RecipeCreateRequest
from app.services.recipe_service import recipe_service
from app.ml.model_loader import model_loader

router = APIRouter(prefix="/api/recipes", tags=["Recipe Catalog"])

@router.get("/all", summary="Get All Recipes with Full Details")
def get_all_recipes_full(
    mealType: Optional[str] = Query(None, description="Filter by meal type (breakfast, lunch, dinner, snack)"),
    dietaryType: Optional[str] = Query(None, description="Filter by dietary type (desi, keto, vegetarian, etc.)"),
):
    """
    Returns ALL recipes in the database with their complete details:
    - Recipe English & Urdu name
    - Full Macronutrients (Calories, Protein, Carbs, Fats)
    - Micronutrients (Fiber, Sodium, Cholesterol)
    - Ingredients with English name, Urdu name, and localized quantity
    - Step-by-step Cooking Instructions (English & Urdu)
    - Preparation times, high-res images, and dietary tags
    """
    recipes = model_loader.bundle.get("recipes", [])
    
    # Filter if parameters provided
    mt_lower = mealType.lower().strip() if mealType else None
    dt_lower = dietaryType.lower().strip() if dietaryType else None
    
    result = []
    for r in recipes:
        if mt_lower and r.get("mealType", "").lower() != mt_lower:
            continue
        if dt_lower and r.get("dietaryType", "").lower() != dt_lower:
            continue
            
        # Ensure complete fields exist with fallbacks
        item = {
            "id": r.get("id"),
            "recipeName": r.get("recipeName"),
            "urduName": r.get("urduName", r.get("recipeName")),
            "calories": float(r.get("calories", 0)),
            "protein": float(r.get("protein", 0)),
            "carbs": float(r.get("carbs", 0)),
            "fat": float(r.get("fat", r.get("fats", 0))),
            "fiber": float(r.get("fiber", 4.0)),
            "sodium": float(r.get("sodium", 320.0)),
            "cholesterol": float(r.get("cholesterol", 25.0)),
            "mealType": r.get("mealType", "Lunch"),
            "dietaryType": r.get("dietaryType", "Desi"),
            "weightGoal": r.get("weightGoal", "weight_loss"),
            "prepTime": f"{r.get('preparationTime', r.get('prepTime', 20))} mins",
            "image": r.get("mealImageURL") or r.get("meal_image_url") or r.get("image") or "/assets/ingredients.jpeg",
            "mealImageURL": r.get("mealImageURL") or r.get("meal_image_url") or r.get("image") or "/assets/ingredients.jpeg",
            "ingredients": r.get("ingredients", []),
            "instructions": r.get("instructions", []),
            "instructions_ur": r.get("instructions_ur", r.get("instructionsUrdu", [])),
        }
        result.append(item)

    return {
        "success": True,
        "total": len(result),
        "recipes": result
    }

@router.get("", response_model=RecipeListResponse, summary="Browse & Search Recipe Catalog (Paginated)")
def get_recipes(
    q: Optional[str] = Query(None, description="Search query in recipe name or ingredients"),
    mealType: Optional[str] = Query(None, description="Filter by meal type (breakfast, lunch, dinner, snack)"),
    dietaryType: Optional[str] = Query(None, description="Filter by dietary type (desi, keto, vegetarian, etc.)"),
    minCalories: Optional[float] = Query(None, ge=0, description="Minimum calorie limit"),
    maxCalories: Optional[float] = Query(None, ge=0, description="Maximum calorie limit"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page")
):
    """
    Returns paginated recipes with comprehensive text and filter parameters.
    """
    return recipe_service.get_all_recipes(
        query=q,
        meal_type=mealType,
        dietary_type=dietaryType,
        min_calories=minCalories,
        max_calories=maxCalories,
        page=page,
        limit=limit
    )

@router.get("/{recipe_id}", summary="Get Single Recipe by ID")
def get_recipe_by_id(recipe_id: str):
    """
    Retrieves full details of a specific recipe including macros, ingredients, and instructions.
    """
    recipe = recipe_service.get_recipe_by_id(recipe_id)
    return {"success": True, "recipe": recipe}

@router.post("", status_code=status.HTTP_201_CREATED, summary="Create New Recipe")
def create_recipe(request: RecipeCreateRequest):
    """
    Adds a new recipe into the Firestore database catalog.
    """
    created = recipe_service.create_recipe(request)
    return {"success": True, "message": "Recipe created successfully.", "recipe": created}
