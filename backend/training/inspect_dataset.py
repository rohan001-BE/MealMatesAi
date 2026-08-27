import json
import os
import sys
from collections import Counter
import pandas as pd
import numpy as np

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def inspect_dataset(file_path: str):
    print("=" * 60)
    print("📊 MEAL MATE DATASET INSPECTION")
    print("=" * 60)

    if not os.path.exists(file_path):
        print(f"❌ Error: File not found at {file_path}")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    total_recipes = len(data)
    print(f"Total recipes loaded: {total_recipes}")

    if total_recipes == 0:
        print("❌ Dataset is empty!")
        return

    # Check structure
    sample = data[0]
    print(f"\nSample Keys: {list(sample.keys())}")

    # Metrics to track
    missing_counts = Counter()
    meal_types = Counter()
    dietary_types = Counter()
    weight_goals = Counter()
    restrictions_set = set()
    calories_list = []
    protein_list = []
    carbs_list = []
    fat_list = []
    fiber_list = []
    names = []

    for item in data:
        name = item.get("recipeName", "")
        names.append(name.strip().lower() if name else "")

        # Nutrients
        calories = item.get("calories")
        nutrients = item.get("nutrients", {}) or {}
        protein = nutrients.get("protein") if isinstance(nutrients, dict) else item.get("protein")
        carbs = nutrients.get("carbs") if isinstance(nutrients, dict) else item.get("carbs")
        fat = nutrients.get("fats", nutrients.get("fat")) if isinstance(nutrients, dict) else item.get("fat")
        fiber = nutrients.get("fiber") if isinstance(nutrients, dict) else item.get("fiber")

        if calories is None: missing_counts["calories"] += 1
        else: calories_list.append(float(calories))

        if protein is None: missing_counts["protein"] += 1
        else: protein_list.append(float(protein))

        if carbs is None: missing_counts["carbs"] += 1
        else: carbs_list.append(float(carbs))

        if fat is None: missing_counts["fat"] += 1
        else: fat_list.append(float(fat))

        if fiber is None: missing_counts["fiber"] += 1
        else: fiber_list.append(float(fiber))

        # Categoricals
        meal_type = item.get("mealType")
        if not meal_type: missing_counts["mealType"] += 1
        else: meal_types[str(meal_type)] += 1

        diet_type = item.get("dietaryType")
        if not diet_type: missing_counts["dietaryType"] += 1
        else: dietary_types[str(diet_type)] += 1

        goal = item.get("weightGoal")
        if not goal: missing_counts["weightGoal"] += 1
        else: weight_goals[str(goal)] += 1

        restr = item.get("restrictions", [])
        if isinstance(restr, list):
            for r in restr:
                restrictions_set.add(str(r).strip())

    print("\n--- Missing Values Count ---")
    for field, count in missing_counts.items():
        print(f"  {field}: {count} ({count/total_recipes*100:.1f}%)")
    if not missing_counts:
        print("  None! All critical nutrition and categorical fields present.")

    duplicates = total_recipes - len(set(names))
    print(f"\n--- Duplicates by Recipe Name ---")
    print(f"  Duplicate count: {duplicates}")

    print("\n--- Meal Type Distribution ---")
    for mt, count in meal_types.most_common():
        print(f"  {mt}: {count}")

    print("\n--- Dietary Type Distribution ---")
    for dt, count in dietary_types.most_common():
        print(f"  {dt}: {count}")

    print("\n--- Weight Goal Distribution ---")
    for wg, count in weight_goals.most_common():
        print(f"  {wg}: {count}")

    print("\n--- Unique Dietary Restrictions / Allergens ---")
    print(f"  {sorted(list(restrictions_set))}")

    if calories_list:
        print("\n--- Calorie Statistics ---")
        print(f"  Min:    {min(calories_list):.1f} kcal")
        print(f"  Max:    {max(calories_list):.1f} kcal")
        print(f"  Mean:   {np.mean(calories_list):.1f} kcal")
        print(f"  Median: {np.median(calories_list):.1f} kcal")
        print(f"  StdDev: {np.std(calories_list):.1f} kcal")

    print("=" * 60)

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, "recipes.json")
    if not os.path.exists(json_path):
        json_path = os.path.join(base_dir, "data", "recipes.json")
    inspect_dataset(json_path)
