import itertools
import random
from typing import List, Dict, Any, Optional

DEFAULT_MEAL_TYPES_MAP = {
    1: ["lunch"],
    2: ["lunch", "dinner"],
    3: ["breakfast", "lunch", "dinner"],
    4: ["breakfast", "lunch", "dinner", "snack"],
    5: ["breakfast", "snack", "lunch", "snack", "dinner"]
}

# Configurable calorie target percentage per meal slot
SLOT_CALORIE_RATIOS = {
    "breakfast": 0.25,
    "lunch": 0.35,
    "dinner": 0.30,
    "snack": 0.10
}

class MealPlanOptimizer:
    def __init__(self, recommender):
        self.recommender = recommender

    def optimize_daily_plan(self,
                            target_calories: float,
                            target_protein: float,
                            target_carbs: float,
                            target_fat: float,
                            meal_types: List[str],
                            dietary_type: str = "balanced",
                            weight_goal: str = "maintenance",
                            allergies: Optional[List[str]] = None,
                            dislikes: Optional[List[str]] = None,
                            restrictions: Optional[List[str]] = None,
                            history_recipe_ids: Optional[set] = None) -> Dict[str, Any]:
        
        history_recipe_ids = history_recipe_ids or set()
        
        # 1. Fetch top candidates per meal slot
        candidates_by_slot = {}
        total_ratio = sum([SLOT_CALORIE_RATIOS.get(m, 0.25) for m in meal_types])

        for slot in meal_types:
            ratio = SLOT_CALORIE_RATIOS.get(slot, 0.25) / total_ratio
            slot_cal = target_calories * ratio
            slot_prot = target_protein * ratio
            slot_carbs = target_carbs * ratio
            slot_fat = target_fat * ratio

            candidates = self.recommender.recommend(
                target_calories=slot_cal,
                target_protein=slot_prot,
                target_carbs=slot_carbs,
                target_fat=slot_fat,
                meal_type=slot,
                dietary_type=dietary_type,
                weight_goal=weight_goal,
                allergies=allergies,
                dislikes=dislikes,
                restrictions=restrictions,
                top_k=10
            )

            # Multi-stage Fallback if slot candidates are empty
            if not candidates:
                # Stage 1: Relax dietary filter
                candidates = self.recommender.recommend(
                    target_calories=slot_cal,
                    target_protein=slot_prot,
                    target_carbs=slot_carbs,
                    target_fat=slot_fat,
                    meal_type=slot,
                    dietary_type=None,
                    weight_goal=weight_goal,
                    allergies=allergies,
                    dislikes=dislikes,
                    restrictions=restrictions,
                    top_k=8
                )

            if not candidates:
                # Stage 2: Try relaxed meal_type (e.g. snack fallback to light breakfast or general)
                fallback_slot = "snack" if ("snack" in slot.lower() or "tea" in slot.lower()) else None
                candidates = self.recommender.recommend(
                    target_calories=slot_cal,
                    target_protein=slot_prot,
                    target_carbs=slot_carbs,
                    target_fat=slot_fat,
                    meal_type=fallback_slot,
                    dietary_type=None,
                    weight_goal=weight_goal,
                    allergies=allergies,
                    dislikes=dislikes,
                    restrictions=None,
                    top_k=6
                )

            if not candidates:
                # Stage 3: General safe fallback matching closest calories
                candidates = self.recommender.recommend(
                    target_calories=slot_cal,
                    target_protein=slot_prot,
                    target_carbs=slot_carbs,
                    target_fat=slot_fat,
                    meal_type=None,
                    dietary_type=None,
                    weight_goal=weight_goal,
                    allergies=None,
                    dislikes=None,
                    restrictions=None,
                    top_k=5
                )

            candidates_by_slot[slot] = candidates or []

        # Check if all slots have candidates; fallback to whatever safe recipes exist
        for slot in meal_types:
            if not candidates_by_slot[slot]:
                # Absolute safety net: assign top general recipes
                candidates_by_slot[slot] = self.recommender.recipes[:5]

        # 2. Search for the best combination minimizing multi-objective loss
        best_combo = None
        best_loss = float("inf")

        slot_candidates_list = [candidates_by_slot[slot] for slot in meal_types]
        
        # Sample or iterate combinations (limit to avoid combinatorial explosion)
        max_evals = 1500
        combinations = list(itertools.product(*slot_candidates_list))
        if len(combinations) > max_evals:
            combinations = random.sample(combinations, max_evals)

        for combo in combinations:
            combo_cal = sum(r["calories"] for r in combo)
            combo_prot = sum(r["protein"] for r in combo)
            combo_carbs = sum(r["carbs"] for r in combo)
            combo_fat = sum(r["fat"] for r in combo)

            # Penalize repetition within the day
            combo_ids = [r["id"] for r in combo]
            internal_dups = len(combo_ids) - len(set(combo_ids))
            
            # Penalize repetition across recent days
            history_dups = sum(1 for cid in combo_ids if cid in history_recipe_ids)

            cal_err = abs(combo_cal - target_calories) / max(target_calories, 1.0)
            prot_err = abs(combo_prot - target_protein) / max(target_protein, 1.0)
            carbs_err = abs(combo_carbs - target_carbs) / max(target_carbs, 1.0)
            fat_err = abs(combo_fat - target_fat) / max(target_fat, 1.0)

            # Weighted Loss Function
            loss = (
                cal_err * 1.5 +
                prot_err * 1.0 +
                carbs_err * 0.8 +
                fat_err * 0.8 +
                (internal_dups * 10.0) +
                (history_dups * 2.5)
            )

            if loss < best_loss:
                best_loss = loss
                best_combo = combo

        if not best_combo:
            return {"error": "Failed to optimize meal plan."}

        total_cals = round(sum(r["calories"] for r in best_combo), 1)
        total_prot = round(sum(r["protein"] for r in best_combo), 1)
        total_carbs = round(sum(r["carbs"] for r in best_combo), 1)
        total_fat = round(sum(r["fat"] for r in best_combo), 1)

        meals_formatted = []
        for slot_name, recipe in zip(meal_types, best_combo):
            m = recipe.copy()
            m["assignedMealSlot"] = slot_name
            m["servings"] = 1 # Natural serving size, no fractional hacks
            meals_formatted.append(m)

        return {
            "meals": meals_formatted,
            "totalCalories": total_cals,
            "totalProtein": total_prot,
            "totalCarbs": total_carbs,
            "totalFat": total_fat,
            "calorieDeviation": round(abs(total_cals - target_calories), 1),
            "optimizationScore": round(max(0.0, 100.0 - (best_loss * 20.0)), 2)
        }

    def generate_multi_day_plan(self,
                                target_calories: float,
                                target_protein: float,
                                target_carbs: float,
                                target_fat: float,
                                days: int = 7,
                                meals_per_day: int = 3,
                                custom_meal_types: Optional[List[str]] = None,
                                dietary_type: str = "balanced",
                                weight_goal: str = "maintenance",
                                allergies: Optional[List[str]] = None,
                                dislikes: Optional[List[str]] = None,
                                restrictions: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        
        meal_types = custom_meal_types or DEFAULT_MEAL_TYPES_MAP.get(meals_per_day, ["breakfast", "lunch", "dinner"])
        plan_days = []
        used_recipes_history = set()

        for d in range(1, days + 1):
            daily_res = self.optimize_daily_plan(
                target_calories=target_calories,
                target_protein=target_protein,
                target_carbs=target_carbs,
                target_fat=target_fat,
                meal_types=meal_types,
                dietary_type=dietary_type,
                weight_goal=weight_goal,
                allergies=allergies,
                dislikes=dislikes,
                restrictions=restrictions,
                history_recipe_ids=used_recipes_history
            )

            if "error" in daily_res:
                return [{"error": daily_res["error"]}]

            daily_res["day"] = d
            plan_days.append(daily_res)

            # Keep rolling history of used recipe IDs to promote maximum multi-day variety
            for m in daily_res.get("meals", []):
                used_recipes_history.add(m["id"])

        return plan_days
