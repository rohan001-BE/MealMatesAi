import datetime
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel, Field
from google.cloud.firestore import FieldFilter
from app.core.firebase import db
from app.core.deps import get_current_user
from app.core.cloudinary_service import upload_image
from app.services.nutrition_service import NutritionEngine
from app.schemas.user import CalorieCalculationRequest, UserProfileUpdateRequest

router = APIRouter(prefix="/api/users", tags=["User Profile & Nutrition"])

class UpdateDietaryTypeRequest(BaseModel):
    dietaryType: str = Field(..., description="'desi', 'keto', 'vegetarian', 'vegan', 'high_protein', 'balanced'")

class UpdateMealTypeRequest(BaseModel):
    mealType: List[str] = Field(..., description="List of meal types e.g. ['breakfast', 'lunch', 'dinner']")

class SaveRecipeRequest(BaseModel):
    recipeName: str
    calories: Optional[float] = 0
    protein: Optional[float] = 0
    carbs: Optional[float] = 0
    fat: Optional[float] = 0
    image: Optional[str] = None
    prepTime: Optional[str] = "20 mins"
    ingredients: Optional[List[Any]] = []
    instructions: Optional[List[str]] = []

class CalorieLogRequest(BaseModel):
    date: Optional[str] = None # 'YYYY-MM-DD'
    caloriesConsumed: float
    targetCalories: Optional[float] = None
    protein: Optional[float] = 0
    carbs: Optional[float] = 0
    fat: Optional[float] = 0

class MealToggleRequest(BaseModel):
    mealIndex: int
    completed: bool
    date: Optional[str] = None

@router.post("/calories", summary="Calculate and Save Daily Calorie Needs")
@router.put("/calories", summary="Calculate and Save Daily Calorie Needs")
def calculate_and_save_calories(
    req: CalorieCalculationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Computes precise BMR and TDEE adjusted for weight goals with Clinical Adjusted Body Weight.
    Automatically updates the user profile in Firestore with calculated daily calories.
    """
    profile = NutritionEngine.compute_full_profile(
        gender=req.gender,
        age=req.age,
        weight=req.weight,
        height=req.height,
        activity_level=req.activityLevel,
        weight_goal=req.weightGoal,
        dietary_type=current_user.get("dietaryType", "desi")
    )

    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    update_data = {
        "gender": req.gender,
        "age": req.age,
        "weight": req.weight,
        "height": req.height,
        "activityLevel": req.activityLevel,
        "weightGoal": req.weightGoal,
        "dailyCalories": profile["dailyCalories"],
        "targetProtein": profile["targetProtein"],
        "targetCarbs": profile["targetCarbs"],
        "targetFat": profile["targetFat"],
        "updatedAt": now_str
    }

    db.collection("users").document(current_user["id"]).update(update_data)
    current_user.update(update_data)

    return {
        "success": True,
        "message": "Daily calorie needs calculated and saved to profile successfully.",
        "dailyCalories": profile["dailyCalories"],
        "bmr": profile["bmr"],
        "tdee": profile["tdee"],
        "bmi": profile.get("bmi"),
        "ibw": profile.get("ibw"),
        "targetMacros": {
            "protein": profile["targetProtein"],
            "carbs": profile["targetCarbs"],
            "fat": profile["targetFat"]
        },
        "updatedProfile": current_user
    }

@router.get("/profile", summary="Get User Profile & Nutritional Info")
def get_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns full user profile, calorie targets, dietary preferences, and custom meals.
    """
    return {
        "success": True,
        "user": {
            "id": current_user["id"],
            "username": current_user.get("username", ""),
            "email": current_user.get("email", ""),
            "profileImage": current_user.get("profileImage", ""),
            "isGoogleUser": current_user.get("isGoogleUser", False)
        },
        "profile": {
            "age": current_user.get("age"),
            "gender": current_user.get("gender"),
            "weight": current_user.get("weight"),
            "height": current_user.get("height"),
            "activityLevel": current_user.get("activityLevel", "moderate"),
            "weightGoal": current_user.get("weightGoal", "weight_loss"),
            "dietaryType": current_user.get("dietaryType", "desi"),
            "mealType": current_user.get("mealType", ["breakfast", "lunch", "dinner"]),
            "dailyCalories": current_user.get("dailyCalories"),
            "customMeals": current_user.get("customMeals", [])
        }
    }

@router.put("/profile", summary="Update User Profile Metrics & Preferences")
def update_user_profile(
    req: UserProfileUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Updates profile metrics (weight, height, diet, meal slots).
    Recalculates calories automatically if biometric metrics change.
    """
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    updates = {"updatedAt": now_str}

    if req.username: updates["username"] = req.username
    if req.age is not None: updates["age"] = req.age
    if req.weight is not None: updates["weight"] = req.weight
    if req.height is not None: updates["height"] = req.height
    if req.gender: updates["gender"] = req.gender
    if req.activityLevel: updates["activityLevel"] = req.activityLevel
    if req.weightGoal: updates["weightGoal"] = req.weightGoal
    if req.dietaryType: updates["dietaryType"] = req.dietaryType
    if req.mealType: updates["mealType"] = req.mealType
    if req.profileImage: updates["profileImage"] = req.profileImage

    merged = {**current_user, **updates}
    if merged.get("age") and merged.get("weight") and merged.get("height"):
        profile = NutritionEngine.compute_full_profile(
            gender=merged.get("gender", "male"),
            age=merged["age"],
            weight=merged["weight"],
            height=merged["height"],
            activity_level=merged.get("activityLevel", "moderate"),
            weight_goal=merged.get("weightGoal", "weight_loss"),
            dietary_type=merged.get("dietaryType", "desi")
        )
        updates["dailyCalories"] = profile["dailyCalories"]
        updates["targetProtein"] = profile["targetProtein"]
        updates["targetCarbs"] = profile["targetCarbs"]
        updates["targetFat"] = profile["targetFat"]

    db.collection("users").document(current_user["id"]).update(updates)
    current_user.update(updates)

    return {
        "success": True,
        "message": "User profile updated successfully.",
        "updatedProfile": current_user
    }

from concurrent.futures import ThreadPoolExecutor

@router.get("/dashboard", summary="Get Live Dashboard Metrics, Plans, and Recipe Stats")
def get_user_dashboard(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Fetches full live dashboard information from Firestore with high-speed parallel queries:
    - User calorie and macro targets
    - Latest meal plan & all plans history
    - Today's completed meals
    - Saved recipe favorites count
    - 7-day calorie tracking history
    """
    user_id = current_user["id"]
    today_str = datetime.date.today().isoformat()

    def fetch_plans():
        try:
            plans_docs = db.collection("meal_plans").where(filter=FieldFilter("userId", "==", user_id)).get()
            local_plans = []
            for d in plans_docs:
                p_data = d.to_dict()
                p_data["id"] = d.id
                local_plans.append(p_data)
            if local_plans:
                local_plans.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
            return local_plans
        except Exception as e:
            print(f"Firestore meal_plans fetch error: {e}")
            return []

    def fetch_today_tracking():
        try:
            completed_doc = db.collection("users").document(user_id).collection("daily_tracking").document(today_str).get()
            if completed_doc.exists:
                return completed_doc.to_dict().get("completedMeals", {})
            return {}
        except Exception as e:
            print(f"Firestore daily_tracking fetch error: {e}")
            return {}

    def fetch_calorie_history():
        try:
            calorie_history_docs = db.collection("users").document(user_id).collection("calorie_logs").get()
            local_history = []
            for d in calorie_history_docs:
                local_history.append(d.to_dict())
            local_history.sort(key=lambda x: x.get("date", ""), reverse=True)
            return local_history[:7]
        except Exception as e:
            print(f"Firestore calorie_logs fetch error: {e}")
            return []

    # Execute all 3 database network calls concurrently in parallel threads
    with ThreadPoolExecutor(max_workers=3) as executor:
        f_plans = executor.submit(fetch_plans)
        f_tracking = executor.submit(fetch_today_tracking)
        f_history = executor.submit(fetch_calorie_history)

        plans = f_plans.result()
        completed_meals = f_tracking.result()
        history = f_history.result()

    latest_plan = plans[0] if plans else None
    saved_recipes = current_user.get("savedRecipes", [])

    # Calculate default targets if not present
    daily_cals = current_user.get("dailyCalories")
    if not daily_cals and current_user.get("weight") and current_user.get("height"):
        prof = NutritionEngine.compute_full_profile(
            gender=current_user.get("gender", "male"),
            age=current_user.get("age", 25),
            weight=current_user.get("weight", 70),
            height=current_user.get("height", 175),
            activity_level=current_user.get("activityLevel", "moderate"),
            weight_goal=current_user.get("weightGoal", "weight_loss"),
            dietary_type=current_user.get("dietaryType", "desi")
        )
        daily_cals = prof["dailyCalories"]
        target_protein = prof["targetProtein"]
        target_carbs = prof["targetCarbs"]
        target_fat = prof["targetFat"]
    else:
        daily_cals = daily_cals or 2000
        target_protein = current_user.get("targetProtein", round((daily_cals * 0.3) / 4))
        target_carbs = current_user.get("targetCarbs", round((daily_cals * 0.45) / 4))
        target_fat = current_user.get("targetFat", round((daily_cals * 0.25) / 9))

    return {
        "success": True,
        "user": {
            "username": current_user.get("username", "Guest"),
            "email": current_user.get("email", ""),
            "profileImage": current_user.get("profileImage", ""),
            "weightGoal": current_user.get("weightGoal", "weight_loss"),
            "dietaryType": current_user.get("dietaryType", "desi"),
            "streakDays": current_user.get("streakDays", 5),
        },
        "targets": {
            "dailyCalories": daily_cals,
            "targetProtein": target_protein,
            "targetCarbs": target_carbs,
            "targetFat": target_fat,
        },
        "latestPlan": latest_plan,
        "allPlans": plans,
        "completedMeals": completed_meals,
        "savedRecipesCount": len(saved_recipes),
        "savedRecipes": saved_recipes,
        "calorieHistory": history,
    }

@router.post("/dashboard/meal-toggle", summary="Save Completed Meal to Firestore")
def toggle_completed_meal(
    req: MealToggleRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user["id"]
    today_str = req.date or datetime.date.today().isoformat()
    
    doc_ref = db.collection("users").document(user_id).collection("daily_tracking").document(today_str)
    doc = doc_ref.get()
    
    completed = doc.to_dict().get("completedMeals", {}) if doc.exists else {}
    completed[str(req.mealIndex)] = req.completed
    
    doc_ref.set({
        "date": today_str,
        "completedMeals": completed,
        "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }, merge=True)

    return {
        "success": True,
        "completedMeals": completed
    }

@router.post("/save-recipe", summary="Save or Bookmark a Recipe in DB")
def save_recipe(
    req: SaveRecipeRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user["id"]
    saved = current_user.get("savedRecipes", [])
    
    # Check if already exists
    existing = next((r for r in saved if r.get("recipeName") == req.recipeName), None)
    if not existing:
        recipe_dict = req.dict()
        recipe_dict["savedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        saved.append(recipe_dict)
        db.collection("users").document(user_id).update({"savedRecipes": saved})

    return {
        "success": True,
        "message": f"'{req.recipeName}' saved to your recipes in database.",
        "savedRecipes": saved
    }

@router.get("/saved-recipes", summary="Get All Saved Recipes from DB")
def get_saved_recipes(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_doc = db.collection("users").document(current_user["id"]).get()
    saved = user_doc.to_dict().get("savedRecipes", []) if user_doc.exists else []
    return {
        "success": True,
        "savedRecipes": saved
    }

@router.delete("/saved-recipes/{recipe_name}", summary="Delete a Saved Recipe from DB")
def delete_saved_recipe(
    recipe_name: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user["id"]
    saved = current_user.get("savedRecipes", [])
    updated = [r for r in saved if r.get("recipeName") != recipe_name]
    
    db.collection("users").document(user_id).update({"savedRecipes": updated})
    return {
        "success": True,
        "message": "Recipe removed from saved list.",
        "savedRecipes": updated
    }

@router.post("/calorie-log", summary="Log Daily Calorie Intake to DB")
def log_daily_calories(
    req: CalorieLogRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user["id"]
    log_date = req.date or datetime.date.today().isoformat()
    
    log_data = {
        "date": log_date,
        "caloriesConsumed": req.caloriesConsumed,
        "targetCalories": req.targetCalories or current_user.get("dailyCalories", 2000),
        "protein": req.protein,
        "carbs": req.carbs,
        "fat": req.fat,
        "loggedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    db.collection("users").document(user_id).collection("calorie_logs").document(log_date).set(log_data)
    
    return {
        "success": True,
        "message": "Calorie intake logged to database.",
        "log": log_data
    }

@router.get("/physical-stats", summary="Get User Physical Stats")
def get_physical_stats(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "success": True,
        "stats": {
            "age": current_user.get("age"),
            "gender": current_user.get("gender"),
            "weight": current_user.get("weight"),
            "height": current_user.get("height"),
            "activityLevel": current_user.get("activityLevel", "moderate"),
            "weightGoal": current_user.get("weightGoal", "weight_loss"),
            "dailyCalories": current_user.get("dailyCalories")
        }
    }

@router.get("/dietary-type", summary="Get User Dietary Type")
def get_dietary_type(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "success": True,
        "dietaryType": current_user.get("dietaryType", "desi")
    }

@router.put("/update-dietary-type", summary="Update User Dietary Type")
def update_dietary_type(req: UpdateDietaryTypeRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    db.collection("users").document(current_user["id"]).update({
        "dietaryType": req.dietaryType,
        "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })
    return {
        "success": True,
        "message": "Dietary type updated successfully.",
        "dietaryType": req.dietaryType
    }

@router.put("/update-meal-type", summary="Update User Meal Types")
def update_meal_type(req: UpdateMealTypeRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    db.collection("users").document(current_user["id"]).update({
        "mealType": req.mealType,
        "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })
    return {
        "success": True,
        "message": "Meal types updated successfully.",
        "mealType": req.mealType
    }

@router.get("/meal-type", summary="Get User Meal Types")
def get_meal_type(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "success": True,
        "mealType": current_user.get("mealType", ["breakfast", "lunch", "dinner"])
    }

@router.post("/profile-image", summary="Upload Profile Picture to Cloudinary")
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    file_bytes = await file.read()
    image_url = upload_image(file_bytes, folder="meal_mates_avatars")

    db.collection("users").document(current_user["id"]).update({
        "profileImage": image_url,
        "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })

    return {
        "success": True,
        "message": "Profile picture updated successfully.",
        "profileImage": image_url
    }

@router.delete("/delete-profile-image", summary="Remove User Profile Picture")
def delete_profile_image(current_user: Dict[str, Any] = Depends(get_current_user)):
    db.collection("users").document(current_user["id"]).update({
        "profileImage": "",
        "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })
    return {"success": True, "message": "Profile picture removed successfully."}

@router.delete("/delete-account", summary="Delete User Account")
def delete_user_account(current_user: Dict[str, Any] = Depends(get_current_user)):
    db.collection("users").document(current_user["id"]).delete()
    return {"success": True, "message": "User account permanently deleted."}
