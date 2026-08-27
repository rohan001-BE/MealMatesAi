import datetime
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from google.cloud.firestore import FieldFilter
from app.core.firebase import db
from app.ml.recommender import KNNRecommender
from app.ml.optimizer import MealPlanOptimizer
from app.services.nutrition_service import NutritionEngine
from app.schemas.meal_plan import MealPlanRequest, MealPlanResponse

class MealPlanService:
    def __init__(self):
        self.recommender = KNNRecommender()
        self.optimizer = MealPlanOptimizer(self.recommender)
        self.meal_plans_ref = db.collection("meal_plans")

    def generate_plan(self, req: MealPlanRequest, user_id: Optional[str] = None) -> MealPlanResponse:
        # 1. Calculate Target Calories & Macros
        if req.dailyCalories is None:
            profile = NutritionEngine.compute_full_profile(
                gender=req.gender or "male",
                age=req.age or 25,
                weight=req.weight or 70.0,
                height=req.height or 175.0,
                activity_level=req.activityLevel or "moderate",
                weight_goal=req.weightGoal or "weight_loss",
                dietary_type=req.dietaryType or "balanced"
            )
            daily_cals = profile["dailyCalories"]
            prot = profile["targetProtein"]
            carbs = profile["targetCarbs"]
            fat = profile["targetFat"]
        else:
            daily_cals = req.dailyCalories
            macros = NutritionEngine.calculate_macro_targets(daily_cals, req.dietaryType or "balanced")
            prot = req.protein if req.protein is not None else macros["protein"]
            carbs = req.carbs if req.carbs is not None else macros["carbs"]
            fat = req.fat if req.fat is not None else macros["fat"]

        # 2. Run Multi-day Optimizer
        days_result = self.optimizer.generate_multi_day_plan(
            target_calories=daily_cals,
            target_protein=prot,
            target_carbs=carbs,
            target_fat=fat,
            days=req.days,
            meals_per_day=req.mealsPerDay,
            custom_meal_types=req.customMealTypes,
            dietary_type=req.dietaryType or "balanced",
            weight_goal=req.weightGoal or "maintenance",
            allergies=req.allergies,
            dislikes=req.dislikes,
            restrictions=req.restrictions
        )

        if days_result and "error" in days_result[0]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=days_result[0]["error"]
            )

        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        plan_data = {
            "userId": user_id or "anonymous",
            "modelVersion": self.recommender.model_version,
            "targetCalories": round(daily_cals, 1),
            "targetProtein": round(prot, 1),
            "targetCarbs": round(carbs, 1),
            "targetFat": round(fat, 1),
            "daysCount": len(days_result),
            "days": days_result,
            "dietaryType": req.dietaryType or "balanced",
            "weightGoal": req.weightGoal or "weight_loss",
            "createdAt": now_str,
            "updatedAt": now_str
        }

        # Save to Firestore if user is authenticated
        if user_id:
            doc_ref = self.meal_plans_ref.document()
            doc_ref.set(plan_data)
            plan_data["id"] = doc_ref.id

        return MealPlanResponse(
            status="success",
            modelVersion=self.recommender.model_version,
            targetCalories=round(daily_cals, 1),
            targetProtein=round(prot, 1),
            targetCarbs=round(carbs, 1),
            targetFat=round(fat, 1),
            daysCount=len(days_result),
            days=days_result
        )

    def get_user_meal_plans(self, user_id: str) -> List[Dict[str, Any]]:
        docs = self.meal_plans_ref.where(filter=FieldFilter("userId", "==", user_id)).get()
        plans = []
        for d in docs:
            data = d.to_dict()
            data["id"] = d.id
            plans.append(data)
        plans.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return plans

    def delete_meal_plan(self, plan_id: str, user_id: str):
        doc = self.meal_plans_ref.document(plan_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Meal plan not found.")
        if doc.to_dict().get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to meal plan.")
        self.meal_plans_ref.document(plan_id).delete()

    def regenerate_meal_plan(self, user_id: str) -> MealPlanResponse:
        # Fetch user's latest meal plan
        plans = self.get_user_meal_plans(user_id)
        if not plans:
            raise HTTPException(status_code=404, detail="No previous meal plan found to regenerate.")

        last_plan = plans[0]
        # Collect previously used recipe IDs to avoid them
        previous_recipe_ids = set()
        for d in last_plan.get("days", []):
            for m in d.get("meals", []):
                previous_recipe_ids.add(m.get("id"))

        # Create regeneration request
        req = MealPlanRequest(
            days=last_plan.get("daysCount", 7),
            dailyCalories=last_plan.get("targetCalories", 2000),
            protein=last_plan.get("targetProtein"),
            carbs=last_plan.get("targetCarbs"),
            fat=last_plan.get("targetFat"),
            dietaryType=last_plan.get("dietaryType", "balanced"),
            weightGoal=last_plan.get("weightGoal", "weight_loss")
        )

        return self.generate_plan(req, user_id=user_id)

meal_plan_service = MealPlanService()
