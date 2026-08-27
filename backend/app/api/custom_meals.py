from typing import Dict, Any, List, Optional
import random
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.core.firebase import db
from app.core.deps import get_current_user, get_optional_user
from app.schemas.custom_meal import CustomNutrientSearchRequest
from app.ml.model_loader import model_loader

router = APIRouter(prefix="/api/custom-meals", tags=["Custom Nutrient Meal Search"])

class IngredientCustomSearchRequest(BaseModel):
    ingredient: str = Field(..., min_length=2, description="Target ingredient name (e.g. 'chicken', 'egg', 'spinach')")
    restrictions: List[str] = Field(default_factory=list, description="Dietary restrictions: ['gluten_free', 'dairy_free', etc.]")
    save: bool = Field(True, description="Whether to save to user profile customMeals")

@router.post("/search", summary="Search Recipes by Calories & Target Nutrient")
def search_custom_meal(
    req: CustomNutrientSearchRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """
    Finds recipes that match a specific calorie target and nutrient target (e.g. 500 kcal + 40g Protein).
    Optionally saves the selected meal to the user profile's customMeals array.
    """
    recipes = model_loader.bundle.get("recipes", [])
    target_cals = req.calories
    n_type = req.nutrient.type.lower()
    n_val = req.nutrient.value

    cal_tolerance = max(50.0, target_cals * 0.15)
    matched = []

    for r in recipes:
        cals = float(r.get("calories", 0))
        nutr_val = float(r.get(n_type, r.get("nutrients", {}).get(n_type, 0)) or 0)

        cal_diff = abs(cals - target_cals)
        nutr_diff = abs(nutr_val - n_val)

        if cal_diff <= cal_tolerance:
            score = (cal_diff / target_cals) * 0.5 + (nutr_diff / max(1.0, n_val)) * 0.5
            matched.append((score, r))

    if not matched:
        for r in recipes:
            cals = float(r.get("calories", 0))
            nutr_val = float(r.get(n_type, 0) or 0)
            score = (abs(cals - target_cals) / target_cals) + (abs(nutr_val - n_val) / max(1.0, n_val))
            matched.append((score, r))

    matched.sort(key=lambda x: x[0])
    top_candidates = [m[1] for m in matched[:10]]
    chosen_meal = random.choice(top_candidates[:3]) if len(top_candidates) >= 3 else top_candidates[0]

    if req.save and current_user:
        custom_meals = current_user.get("customMeals", [])
        custom_meals.append({
            "recipeId": chosen_meal.get("id"),
            "recipeName": chosen_meal.get("recipeName"),
            "calories": chosen_meal.get("calories"),
            "targetNutrient": {"type": n_type, "value": n_val},
            "mealImageURL": chosen_meal.get("mealImageURL", "")
        })
        db.collection("users").document(current_user["id"]).update({"customMeals": custom_meals})

    return {
        "success": True,
        "message": "Custom nutrient meal found successfully.",
        "meal": chosen_meal,
        "alternatives": top_candidates[1:5]
    }

@router.post("/ingredient-search", summary="Search Recipes by Specific Ingredient & Restrictions")
def search_by_ingredient(
    req: IngredientCustomSearchRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """
    Matches recipes containing a specific ingredient (e.g., 'egg', 'paneer', 'chicken')
    and satisfying all required dietary restrictions (e.g., 'gluten_free', 'dairy_free').
    """
    recipes = model_loader.bundle.get("recipes", [])
    ing_clean = req.ingredient.strip().lower()
    req_restrictions = set(r.lower() for r in req.restrictions)

    matched = []
    for r in recipes:
        r_restr = set(x.lower() for x in r.get("restrictions", []))
        if req_restrictions and not req_restrictions.issubset(r_restr):
            continue

        ingredients = r.get("ingredients", [])
        ing_found = False
        for i in ingredients:
            if isinstance(i, dict):
                en = i.get("englishName", "").lower()
                ur = i.get("urduName", "").lower()
                if ing_clean in en or ing_clean in ur:
                    ing_found = True
                    break
            elif ing_clean in str(i).lower():
                ing_found = True
                break

        if ing_found or ing_clean in r.get("recipeName", "").lower():
            matched.append(r)

    if not matched:
        raise HTTPException(
            status_code=404,
            detail=f"No recipes found containing '{req.ingredient}' with the specified restrictions."
        )

    chosen = random.choice(matched)

    if req.save and current_user:
        custom_meals = current_user.get("customMeals", [])
        custom_meals.append({
            "recipeId": chosen.get("id"),
            "recipeName": chosen.get("recipeName"),
            "calories": chosen.get("calories"),
            "ingredientSearched": req.ingredient,
            "restrictions": req.restrictions,
            "mealImageURL": chosen.get("mealImageURL", "")
        })
        db.collection("users").document(current_user["id"]).update({"customMeals": custom_meals})

    return {
        "success": True,
        "count": len(matched),
        "meal": chosen,
        "alternatives": [m for m in matched if m.get("id") != chosen.get("id")][:5]
    }

@router.get("", summary="Get User Saved Custom Meals")
def get_user_custom_meals(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns the array of custom nutrient meals saved in the user's profile.
    """
    return {
        "success": True,
        "customMeals": current_user.get("customMeals", [])
    }

@router.delete("/{index}", summary="Delete Saved Custom Meal by Index")
def delete_custom_meal(index: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Removes a custom meal from the user's customMeals array by its index.
    """
    custom_meals = current_user.get("customMeals", [])
    if index < 0 or index >= len(custom_meals):
        raise HTTPException(status_code=404, detail="Custom meal index out of range.")
    
    removed = custom_meals.pop(index)
    db.collection("users").document(current_user["id"]).update({"customMeals": custom_meals})

    return {
        "success": True,
        "message": "Custom meal removed successfully.",
        "removedMeal": removed,
        "remainingCustomMeals": custom_meals
    }

@router.delete("/by-id/{meal_id}", summary="Delete Saved Custom Meal by Recipe ID")
def delete_custom_meal_by_id(meal_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Removes a custom meal from the user's customMeals array by its recipeId.
    """
    custom_meals = current_user.get("customMeals", [])
    filtered = [m for m in custom_meals if m.get("recipeId") != meal_id]
    
    if len(filtered) == len(custom_meals):
        raise HTTPException(status_code=404, detail="Meal not found in saved custom meals.")

    db.collection("users").document(current_user["id"]).update({"customMeals": filtered})

    return {
        "success": True,
        "message": "Custom meal removed successfully.",
        "remainingCustomMeals": filtered
    }
