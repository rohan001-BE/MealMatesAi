import json
import os
import re
import sys
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

TYPO_FIXES = {
    "dinnner": "dinner",
    "dairy_frees": "dairy_free",
    "low_cholestero": "low_cholesterol",
    "low_suga": "low_sugar",
    "low_fats": "low_fat",
    "nut_free_(except_almond_flour)": "nut_free",
    "lactose_free_(may_vary_based_on_cheese_type)": "lactose_free",
    "lactose_free_(minimal_butter)": "lactose_free",
}

# Domain heuristic patterns to clean ground-truth label noise
BREAKFAST_KEYWORDS = [
    "pancake", "pancakes", "waffle", "waffles", "oat", "oats", "oatmeal",
    "french toast", "scramble", "scrambled", "omelet", "omelette", "paratha",
    "cereal", "granola", "porridge", "breakfast", "chia seed pudding", "chia pudding",
    "egg cup", "egg wrap", "egg muffin", "poached egg", "egg toast", "toast"
]

SNACK_KEYWORDS = [
    "smoothie", "shake", "protein bar", "protein balls", "energy bites", "energy ball",
    "dip", "chips", "nuts", "popcorn", "cookie", "cookies", "muffin", "muffins",
    "cracker", "crackers", "snack", "trail mix", "crisps", "hummus", "fat bombs",
    "bites", "almond flour crackers", "energy bar", "chia pudding"
]

HEAVY_MEAL_KEYWORDS = [
    "biryani", "karahi", "handi", "curry", "steak", "ribeye", "roast",
    "casserole", "stew", "supreme", "kebab", "bbq", "tikka", "pasta",
    "lasagna", "burger", "cheeseburger", "pizza", "chops", "nihari",
    "haleem", "prawns", "shrimp stir fry", "beef feast", "lamb"
]

def correct_meal_type_noise(name: str, current_type: str, calories: float, prep_time: int) -> str:
    name_clean = name.lower()

    # 1. Obvious breakfast items mislabeled as dinner/lunch/snack
    if any(re.search(r"\b" + re.escape(kw) + r"\b", name_clean) for kw in BREAKFAST_KEYWORDS):
        return "breakfast"

    # 2. Obvious snacks (bars, smoothies, bites, dips) mislabeled as dinner/lunch
    if any(re.search(r"\b" + re.escape(kw) + r"\b", name_clean) for kw in SNACK_KEYWORDS):
        if calories <= 350:
            return "snack"

    # 3. Obvious heavy dinner items (ribeyes, casseroles, curries) mislabeled as breakfast/snack
    if any(re.search(r"\b" + re.escape(kw) + r"\b", name_clean) for kw in HEAVY_MEAL_KEYWORDS):
        if current_type in ["breakfast", "snack"]:
            return "dinner" if (calories >= 450 or prep_time >= 25) else "lunch"

    return current_type

def normalize_text(text: str) -> str:
    if not text or not isinstance(text, str):
        return ""
    text = text.strip().lower()
    text = re.sub(r"[\s\-]+", "_", text)
    return TYPO_FIXES.get(text, text)

def clean_recipe_dataset(input_json_path: str, output_dir: str):
    print("=" * 70)
    print("🧹 PREPROCESSING, NOISE CORRECTION & CLEANING MEAL MATE RECIPES")
    print("=" * 70)

    os.makedirs(output_dir, exist_ok=True)

    with open(input_json_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    print(f"Loaded {len(raw_data)} raw recipes from {input_json_path}")

    cleaned_recipes = []
    seen_names = set()
    label_corrections = 0

    for idx, item in enumerate(raw_data):
        raw_id = item.get("_id")
        if isinstance(raw_id, dict) and "$oid" in raw_id:
            recipe_id = str(raw_id["$oid"])
        elif raw_id:
            recipe_id = str(raw_id)
        else:
            recipe_id = f"recipe_{idx+1:04d}"

        name = item.get("recipeName", "").strip()
        if not name:
            continue

        name_lower = name.lower()
        if name_lower in seen_names:
            continue
        seen_names.add(name_lower)

        calories = float(item.get("calories", 0) or 0)
        nutrients = item.get("nutrients", {}) or {}
        protein = float(nutrients.get("protein", item.get("protein", 0)) or 0)
        carbs = float(nutrients.get("carbs", item.get("carbs", 0)) or 0)
        fat = float(nutrients.get("fats", nutrients.get("fat", item.get("fat", 0))) or 0)
        fiber = float(nutrients.get("fiber", item.get("fiber", 0)) or 0)
        sodium = float(nutrients.get("sodium", item.get("sodium", 0)) or 0)
        cholesterol = float(nutrients.get("cholesterol", item.get("cholesterol", 0)) or 0)
        prep_time = int(item.get("preparationTime", 15) or 15)
        serves = int(item.get("serves", 1) or 1)
        image_url = item.get("mealImageURL", "") or ""

        if calories <= 0:
            continue

        raw_meal_type = normalize_text(item.get("mealType", "lunch"))
        dietary_type = normalize_text(item.get("dietaryType", "balanced"))
        weight_goal = normalize_text(item.get("weightGoal", "maintenance"))

        # Apply domain label noise correction
        corrected_meal_type = correct_meal_type_noise(name, raw_meal_type, calories, prep_time)
        if corrected_meal_type != raw_meal_type:
            label_corrections += 1

        raw_restrictions = item.get("restrictions", []) or []
        restrictions = [normalize_text(r) for r in raw_restrictions if r]

        ingredients = item.get("ingredients", []) or []
        instructions = item.get("instructions", []) or []

        if isinstance(ingredients, list):
            ingredients_text = "; ".join([
                f"{ing.get('englishName', '')} ({ing.get('quantity', '')})".strip()
                if isinstance(ing, dict) else str(ing)
                for ing in ingredients
            ])
            ing_names_only = " ".join([
                ing.get('englishName', '') if isinstance(ing, dict) else str(ing)
                for ing in ingredients
            ])
        else:
            ingredients_text = str(ingredients)
            ing_names_only = str(ingredients)

        if isinstance(instructions, list):
            instructions_text = " | ".join([str(step).strip() for step in instructions])
        else:
            instructions_text = str(instructions)

        # Triple-weighted semantic text representation
        semantic_text = f"{name} {name} {name} {ing_names_only} {dietary_type}"

        cleaned_recipe = {
            "id": recipe_id,
            "recipeName": name,
            "mealType": corrected_meal_type,
            "dietaryType": dietary_type,
            "weightGoal": weight_goal,
            "calories": calories,
            "protein": protein,
            "carbs": carbs,
            "fat": fat,
            "fiber": fiber,
            "sodium": sodium,
            "cholesterol": cholesterol,
            "preparationTime": prep_time,
            "serves": serves,
            "restrictions": restrictions,
            "ingredients": ingredients,
            "instructions": instructions,
            "mealImageURL": image_url,
            "semantic_text": semantic_text,
            "restrictions_str": ",".join(restrictions),
            "ingredients_str": ingredients_text,
            "instructions_str": instructions_text
        }
        cleaned_recipes.append(cleaned_recipe)

    print(f"Cleaned valid recipes: {len(cleaned_recipes)}")
    print(f"🔧 Conflicting ground-truth labels corrected: {label_corrections}")

    # Save Cleaned JSON
    cleaned_json_path = os.path.join(output_dir, "cleaned_recipes.json")
    with open(cleaned_json_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_recipes, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved cleaned JSON to: {cleaned_json_path}")

    # Convert to DataFrame
    df = pd.DataFrame(cleaned_recipes)
    cleaned_csv_path = os.path.join(output_dir, "cleaned_recipes.csv")
    
    csv_columns = [
        "id", "recipeName", "mealType", "dietaryType", "weightGoal",
        "calories", "protein", "carbs", "fat", "fiber", "sodium", "cholesterol",
        "preparationTime", "serves", "semantic_text", "restrictions_str", "ingredients_str", "instructions_str", "mealImageURL"
    ]
    df[csv_columns].to_csv(cleaned_csv_path, index=False, encoding="utf-8")
    print(f"✅ Saved clean master CSV to: {cleaned_csv_path}")

    # Stratified 70% Train / 10% Validation / 20% Test Split
    print("\n--- Stratified Splitting: 70% Train, 10% Validation, 20% Test ---")
    train_val_df, test_df = train_test_split(
        df, test_size=0.20, random_state=42, stratify=df["mealType"]
    )
    train_df, val_df = train_test_split(
        train_val_df, test_size=0.125, random_state=42, stratify=train_val_df["mealType"]
    )

    print(f"  Train set:      {len(train_df)} recipes ({len(train_df)/len(df)*100:.1f}%)")
    print(f"  Validation set: {len(val_df)} recipes ({len(val_df)/len(df)*100:.1f}%)")
    print(f"  Test set:       {len(test_df)} recipes ({len(test_df)/len(df)*100:.1f}%)")

    train_csv_path = os.path.join(output_dir, "train_recipes.csv")
    val_csv_path = os.path.join(output_dir, "val_recipes.csv")
    test_csv_path = os.path.join(output_dir, "test_recipes.csv")

    train_df[csv_columns].to_csv(train_csv_path, index=False, encoding="utf-8")
    val_df[csv_columns].to_csv(val_csv_path, index=False, encoding="utf-8")
    test_df[csv_columns].to_csv(test_csv_path, index=False, encoding="utf-8")

    print(f"✅ Saved: {train_csv_path}")
    print(f"✅ Saved: {val_csv_path}")
    print(f"✅ Saved: {test_csv_path}")
    print("=" * 70)

    return cleaned_json_path, cleaned_csv_path

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_file = os.path.join(base_dir, "recipes.json")
    if not os.path.exists(input_file):
        input_file = os.path.join(base_dir, "data", "recipes.json")
    data_dir = os.path.join(base_dir, "data")
    clean_recipe_dataset(input_file, data_dir)
