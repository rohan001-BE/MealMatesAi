from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.meal_plan import MealPlanRequest, MealPlanResponse
from app.services.meal_plan_service import meal_plan_service
from app.core.deps import get_optional_user, get_current_user

router = APIRouter(prefix="/api/meal-plans", tags=["Personalized Meal Planner"])

@router.post(
    "/generate",
    response_model=MealPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate 1-14 Day Balanced Meal Plan",
    description="""
    Generates a multi-day personalized meal plan using **Combinatorial Optimization & AI Candidate Retrieval**.
    - If user is authenticated, the generated meal plan is automatically saved to user's history in Firestore.
    - Zero fractional servings scaling hacks.
    - Guaranteed zero allergen/restriction violations.
    """
)
def generate_meal_plan(
    request: MealPlanRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    user_id = current_user.get("id") if current_user else None
    return meal_plan_service.generate_plan(request, user_id=user_id)

@router.get("/history", summary="Get User Saved Meal Plans History")
def get_user_meal_plans(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Fetches all historical generated meal plans for the logged-in user from Firestore.
    """
    plans = meal_plan_service.get_user_meal_plans(current_user["id"])
    return {
        "success": True,
        "count": len(plans),
        "mealPlans": plans
    }

@router.post("/regenerate", summary="Regenerate Meal Plan (Rotates Recipes)")
def regenerate_meal_plan(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Regenerates the user's latest meal plan using fresh recipe candidates while maintaining calorie/macro goals.
    """
    return meal_plan_service.regenerate_meal_plan(current_user["id"])

@router.delete("/{meal_plan_id}", summary="Delete Saved Meal Plan")
def delete_meal_plan(
    meal_plan_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Deletes a specific meal plan from the user's Firestore collection.
    """
    meal_plan_service.delete_meal_plan(meal_plan_id, current_user["id"])
    return {
        "success": True,
        "message": "Meal plan deleted successfully."
    }
