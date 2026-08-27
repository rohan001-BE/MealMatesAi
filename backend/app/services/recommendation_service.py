from typing import Dict, Any, List
from app.ml.recommender import KNNRecommender
from app.services.nutrition_service import NutritionEngine
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse

class RecommendationService:
    def __init__(self):
        self.recommender = KNNRecommender()

    def get_recommendations(self, req: RecommendationRequest) -> RecommendationResponse:
        # 1. Determine Target Calories & Macros
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

        # Slot target calories (e.g. 35% for lunch, 25% for breakfast)
        slot_map = {"breakfast": 0.25, "lunch": 0.35, "dinner": 0.30, "snack": 0.10}
        slot_ratio = slot_map.get(str(req.mealType).lower(), 0.35)

        slot_cals = daily_cals * slot_ratio
        slot_prot = prot * slot_ratio
        slot_carbs = carbs * slot_ratio
        slot_fat = fat * slot_ratio

        # 2. Get Top-K recommendations from KNN
        recipes = self.recommender.recommend(
            target_calories=slot_cals,
            target_protein=slot_prot,
            target_carbs=slot_carbs,
            target_fat=slot_fat,
            meal_type=req.mealType or "lunch",
            dietary_type=req.dietaryType or "balanced",
            weight_goal=req.weightGoal or "maintenance",
            allergies=req.allergies,
            dislikes=req.dislikes,
            restrictions=req.restrictions,
            top_k=req.topK
        )

        return RecommendationResponse(
            status="success",
            modelVersion=self.recommender.model_version,
            count=len(recipes),
            targetCalories=round(slot_cals, 1),
            targetProtein=round(slot_prot, 1),
            targetCarbs=round(slot_carbs, 1),
            targetFat=round(slot_fat, 1),
            recommendations=recipes
        )

recommendation_service = RecommendationService()
