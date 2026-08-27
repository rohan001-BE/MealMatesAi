import json
import os
from typing import List, Dict, Any, Tuple
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

# Known categories for stable one-hot ordering
KNOWN_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"]
KNOWN_DIETARY_TYPES = [
    "desi", "non_vegetarian", "keto", "vegetarian", "mediterranean",
    "vegan", "high_protein", "balanced", "low_carb", "pescatarian"
]
KNOWN_WEIGHT_GOALS = ["weight_loss", "weight_gain", "maintenance"]
KNOWN_RESTRICTIONS = [
    "gluten_free", "nut_free", "egg_free", "lactose_free",
    "dairy_free", "low_carb", "low_sugar", "low_sodium", "low_cholesterol", "low_fat"
]


NUMERICAL_COLS = [
    "calories", "protein", "carbs", "fat", "fiber",
    "sodium", "cholesterol", "protein_ratio", "carb_ratio", "fat_ratio",
    "preparationTime"
]

class RecipeFeaturePipeline:
    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_columns: List[str] = []
        self.is_fitted = False

    def _extract_raw_features(self, recipe: Dict[str, Any]) -> Dict[str, float]:
        calories = float(recipe.get("calories", 0) or 0)
        protein = float(recipe.get("protein", 0) or 0)
        carbs = float(recipe.get("carbs", 0) or 0)
        fat = float(recipe.get("fat", 0) or 0)
        fiber = float(recipe.get("fiber", 0) or 0)
        sodium = float(recipe.get("sodium", 0) or 0)
        cholesterol = float(recipe.get("cholesterol", 0) or 0)
        prep_time = float(recipe.get("preparationTime", 15) or 15)

        # Macro ratios (normalized by caloric contribution)
        safe_cal = max(calories, 1.0)
        protein_ratio = (protein * 4.0) / safe_cal
        carb_ratio = (carbs * 4.0) / safe_cal
        fat_ratio = (fat * 9.0) / safe_cal

        feat: Dict[str, float] = {
            "calories": calories,
            "protein": protein,
            "carbs": carbs,
            "fat": fat,
            "fiber": fiber,
            "sodium": sodium,
            "cholesterol": cholesterol,
            "protein_ratio": min(max(protein_ratio, 0.0), 1.0),
            "carb_ratio": min(max(carb_ratio, 0.0), 1.0),
            "fat_ratio": min(max(fat_ratio, 0.0), 1.0),
            "preparationTime": prep_time,
        }

        # One-hot mealType
        meal_type = str(recipe.get("mealType", "")).lower()
        for mt in KNOWN_MEAL_TYPES:
            feat[f"meal_type_{mt}"] = 1.0 if meal_type == mt else 0.0

        # One-hot dietaryType
        diet_type = str(recipe.get("dietaryType", "")).lower()
        for dt in KNOWN_DIETARY_TYPES:
            feat[f"diet_{dt}"] = 1.0 if diet_type == dt else 0.0

        # One-hot weightGoal
        goal = str(recipe.get("weightGoal", "")).lower()
        for wg in KNOWN_WEIGHT_GOALS:
            feat[f"goal_{wg}"] = 1.0 if goal == wg else 0.0

        # Multi-hot restrictions
        restr_list = recipe.get("restrictions", []) or []
        if isinstance(restr_list, str):
            restr_list = [r.strip().lower() for r in restr_list.split(",") if r]
        else:
            restr_list = [str(r).strip().lower() for r in restr_list]

        for r in KNOWN_RESTRICTIONS:
            feat[f"restr_{r}"] = 1.0 if r in restr_list else 0.0

        return feat

    def fit_transform(self, recipes: List[Dict[str, Any]]) -> Tuple[np.ndarray, pd.DataFrame]:
        feature_rows = [self._extract_raw_features(r) for r in recipes]
        raw_df = pd.DataFrame(feature_rows)
        self.feature_columns = list(raw_df.columns)

        # Scale numerical columns
        scaled_matrix = raw_df.copy()
        scaled_matrix[NUMERICAL_COLS] = self.scaler.fit_transform(raw_df[NUMERICAL_COLS])
        self.is_fitted = True

        return scaled_matrix.values, raw_df

    def transform(self, recipes: List[Dict[str, Any]]) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("FeaturePipeline must be fitted before calling transform!")
        feature_rows = [self._extract_raw_features(r) for r in recipes]
        df = pd.DataFrame(feature_rows)
        # Ensure exact column alignment
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0.0
        df = df[self.feature_columns]

        scaled_matrix = df.copy()
        scaled_matrix[NUMERICAL_COLS] = self.scaler.transform(df[NUMERICAL_COLS])
        return scaled_matrix.values

    def transform_user_target(self, target_calories: float, target_protein: float,
                              target_carbs: float, target_fat: float,
                              meal_type: str = "lunch", dietary_type: str = "balanced",
                              weight_goal: str = "maintenance",
                              restrictions: List[str] = None) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("FeaturePipeline must be fitted before calling transform_user_target!")

        restrictions = restrictions or []
        pseudo_recipe = {
            "calories": target_calories,
            "protein": target_protein,
            "carbs": target_carbs,
            "fat": target_fat,
            "fiber": 10.0,
            "sodium": 500.0,
            "cholesterol": 100.0,
            "preparationTime": 20,
            "mealType": meal_type,
            "dietaryType": dietary_type,
            "weightGoal": weight_goal,
            "restrictions": restrictions
        }
        return self.transform([pseudo_recipe])
