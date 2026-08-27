import os
import sys
import json
import pandas as pd
import numpy as np

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.ml.model_loader import model_loader
from app.ml.recommender import KNNRecommender
from app.ml.optimizer import MealPlanOptimizer
from app.services.nutrition_service import NutritionEngine

def evaluate_recommender(data_dir: str):
    print("=" * 60)
    print("🧪 EVALUATING MEAL MATE RECOMMENDATION SYSTEM")
    print("=" * 60)

    test_csv = os.path.join(data_dir, "test_recipes.csv")
    if not os.path.exists(test_csv):
        print(f"❌ Error: {test_csv} not found.")
        return

    test_df = pd.read_csv(test_csv)
    print(f"Loaded {len(test_df)} test recipes for evaluation.")

    recommender = KNNRecommender()
    optimizer = MealPlanOptimizer(recommender)

    # 1. Single Recommendation Target Error Benchmarking
    print("\n--- 1. Single Recipe Recommendation Test ---")
    calorie_errors = []
    protein_errors = []
    carbs_errors = []
    fat_errors = []

    # Run 50 simulated test queries with random target calorie profiles
    np.random.seed(42)
    test_cals = np.random.uniform(300, 800, size=50)

    for target_cal in test_cals:
        macros = NutritionEngine.calculate_macro_targets(target_cal, "balanced")
        recs = recommender.recommend(
            target_calories=target_cal,
            target_protein=macros["protein"],
            target_carbs=macros["carbs"],
            target_fat=macros["fat"],
            meal_type="lunch",
            dietary_type="balanced",
            top_k=1
        )
        if recs:
            top_rec = recs[0]
            calorie_errors.append(abs(top_rec["calories"] - target_cal))
            protein_errors.append(abs(top_rec["protein"] - macros["protein"]))
            carbs_errors.append(abs(top_rec["carbs"] - macros["carbs"]))
            fat_errors.append(abs(top_rec["fat"] - macros["fat"]))

    print(f"  Calorie MAE (Mean Absolute Error): {np.mean(calorie_errors):.2f} kcal")
    print(f"  Protein MAE:                      {np.mean(protein_errors):.2f} g")
    print(f"  Carbohydrates MAE:                {np.mean(carbs_errors):.2f} g")
    print(f"  Fats MAE:                         {np.mean(fat_errors):.2f} g")

    # 2. Hard Restriction Safety Test
    print("\n--- 2. Safety & Allergy Hard-Filter Test ---")
    test_allergy = "shrimp"
    allergy_recs = recommender.recommend(
        target_calories=500,
        target_protein=30,
        target_carbs=50,
        target_fat=15,
        allergies=[test_allergy],
        top_k=20
    )
    violations = 0
    for r in allergy_recs:
        ing_text = json.dumps(r.get("ingredients", [])).lower()
        if test_allergy in r.get("recipeName", "").lower() or test_allergy in ing_text:
            violations += 1

    print(f"  Tested allergy: '{test_allergy}' across {len(allergy_recs)} recommended recipes")
    print(f"  Allergy Violations: {violations} (Safety Rate: {(1 - violations/max(len(allergy_recs),1))*100:.1f}%)")

    # 3. 7-Day Meal Plan Optimization Test
    print("\n--- 3. 7-Day Meal Plan Optimization Test ---")
    target_daily_cals = 2000.0
    macros_daily = NutritionEngine.calculate_macro_targets(target_daily_cals, "balanced")

    week_plan = optimizer.generate_multi_day_plan(
        target_calories=target_daily_cals,
        target_protein=macros_daily["protein"],
        target_carbs=macros_daily["carbs"],
        target_fat=macros_daily["fat"],
        days=7,
        meals_per_day=3,
        dietary_type="balanced"
    )

    day_cals = [d["totalCalories"] for d in week_plan if "totalCalories" in d]
    day_devs = [d["calorieDeviation"] for d in week_plan if "calorieDeviation" in d]
    all_meal_ids = [m["id"] for d in week_plan for m in d.get("meals", [])]
    unique_meal_ids = set(all_meal_ids)

    print(f"  Target Daily Calories:   {target_daily_cals} kcal")
    print(f"  Average Daily Calories:  {np.mean(day_cals):.1f} kcal")
    print(f"  Average Daily Deviation: {np.mean(day_devs):.1f} kcal ({(np.mean(day_devs)/target_daily_cals)*100:.2f}%)")
    print(f"  Total Meals Scheduled:   {len(all_meal_ids)}")
    print(f"  Unique Recipes Used:     {len(unique_meal_ids)} (Variety Rate: {len(unique_meal_ids)/max(len(all_meal_ids),1)*100:.1f}%)")

    print("=" * 60)

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    evaluate_recommender(data_dir)
