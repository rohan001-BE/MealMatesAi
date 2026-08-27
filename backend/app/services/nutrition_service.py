from typing import Dict, Any, Tuple

ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9
}

MACRO_SPLITS = {
    "desi": {"protein_pct": 0.30, "carbs_pct": 0.45, "fat_pct": 0.25},
    "keto": {"protein_pct": 0.25, "carbs_pct": 0.05, "fat_pct": 0.70},
    "high_protein": {"protein_pct": 0.40, "carbs_pct": 0.35, "fat_pct": 0.25},
    "low_carb": {"protein_pct": 0.35, "carbs_pct": 0.20, "fat_pct": 0.45},
    "mediterranean": {"protein_pct": 0.25, "carbs_pct": 0.45, "fat_pct": 0.30},
    "vegetarian": {"protein_pct": 0.25, "carbs_pct": 0.50, "fat_pct": 0.25},
    "vegan": {"protein_pct": 0.25, "carbs_pct": 0.55, "fat_pct": 0.20},
    "balanced": {"protein_pct": 0.30, "carbs_pct": 0.45, "fat_pct": 0.25}
}

class NutritionEngine:
    @staticmethod
    def calculate_ideal_body_weight(gender: str, height_cm: float) -> float:
        """
        Calculates Devine/Hamwi Ideal Body Weight (IBW) based on height in cm.
        """
        gender_norm = str(gender).strip().lower()
        height_inches = height_cm / 2.54
        inches_over_5ft = max(0.0, height_inches - 60.0)
        
        if gender_norm == "female":
            ibw = 45.5 + 2.3 * inches_over_5ft
        else:
            ibw = 50.0 + 2.3 * inches_over_5ft
            
        if ibw <= 30.0:
            ibw = 22.0 * ((height_cm / 100.0) ** 2)
        return round(ibw, 1)

    @staticmethod
    def calculate_adjusted_body_weight(gender: str, weight_kg: float, height_cm: float) -> float:
        """
        Clinical Adjusted Body Weight (ABW) for overweight/obese individuals:
        ABW = IBW + 0.25 * (Actual_Weight - IBW)
        Prevents gross BMR/calorie overestimation on metabolically inactive adipose tissue.
        """
        ibw = NutritionEngine.calculate_ideal_body_weight(gender, height_cm)
        height_m = max(1.0, height_cm / 100.0)
        bmi = weight_kg / (height_m ** 2)
        
        if weight_kg > 1.2 * ibw or bmi >= 27.5:
            adjusted_wt = ibw + 0.25 * (weight_kg - ibw)
            return round(adjusted_wt, 1)
        return round(weight_kg, 1)

    @staticmethod
    def calculate_bmr(gender: str, age: int, weight: float, height: float) -> float:
        """
        Mifflin-St Jeor Equation with Clinical Adjusted Body Weight for obesity.
        """
        gender_norm = str(gender).strip().lower()
        eff_weight = NutritionEngine.calculate_adjusted_body_weight(gender_norm, weight, height)
        
        if gender_norm == "female":
            bmr = 10.0 * eff_weight + 6.25 * height - 5.0 * age - 161.0
        else:
            bmr = 10.0 * eff_weight + 6.25 * height - 5.0 * age + 5.0
        return round(max(bmr, 800.0), 1)

    @staticmethod
    def calculate_tdee(bmr: float, activity_level: str) -> float:
        act_norm = str(activity_level).strip().lower()
        multiplier = ACTIVITY_MULTIPLIERS.get(act_norm, 1.375)
        return round(bmr * multiplier, 1)

    @staticmethod
    def calculate_daily_target(tdee: float, weight_goal: str, gender: str = "male", weight: float = 70.0, height: float = 175.0) -> float:
        """
        Calculates daily calorie target.
        For weight loss / cutting / light diet plans:
        - Ensures an effective, safe caloric deficit.
        - Caps overweight/obese fat loss diets to a light, clean target (1400-1800 kcal) rather than excessively high calories.
        """
        goal_norm = str(weight_goal).strip().lower()
        gender_norm = str(gender).strip().lower()
        height_m = max(1.0, height / 100.0)
        bmi = weight / (height_m ** 2)

        if "loss" in goal_norm:
            # If BMI is high (obesity class I, II, III), provide a structured light diet plan
            if bmi >= 35.0 or weight >= 110.0:
                # Obese -> Clean Light Diet target: 1500-1750 kcal for men, 1300-1500 kcal for women
                target = min(tdee - 650.0, 1750.0 if gender_norm != "female" else 1500.0)
                target = max(target, 1300.0 if gender_norm != "female" else 1200.0)
            elif bmi >= 28.0 or weight >= 90.0:
                target = min(tdee - 550.0, 1850.0 if gender_norm != "female" else 1550.0)
                target = max(target, 1350.0 if gender_norm != "female" else 1200.0)
            else:
                target = tdee - 500.0
                target = max(target, 1200.0)
        elif "gain" in goal_norm:
            target = tdee + 500.0
        else:
            target = tdee

        return round(max(target, 1200.0), 0)

    @staticmethod
    def calculate_macro_targets(calories: float, dietary_type: str) -> Dict[str, float]:
        diet_norm = str(dietary_type).strip().lower()
        split = MACRO_SPLITS.get(diet_norm, MACRO_SPLITS["balanced"])

        protein_g = (calories * split["protein_pct"]) / 4.0
        carbs_g = (calories * split["carbs_pct"]) / 4.0
        fat_g = (calories * split["fat_pct"]) / 9.0

        return {
            "protein": round(protein_g, 1),
            "carbs": round(carbs_g, 1),
            "fat": round(fat_g, 1),
            "protein_ratio": split["protein_pct"],
            "carb_ratio": split["carbs_pct"],
            "fat_ratio": split["fat_pct"],
        }

    @staticmethod
    def compute_full_profile(gender: str, age: int, weight: float, height: float,
                             activity_level: str, weight_goal: str,
                             dietary_type: str) -> Dict[str, Any]:
        bmr = NutritionEngine.calculate_bmr(gender, age, weight, height)
        tdee = NutritionEngine.calculate_tdee(bmr, activity_level)
        daily_cal = NutritionEngine.calculate_daily_target(tdee, weight_goal, gender=gender, weight=weight, height=height)
        macros = NutritionEngine.calculate_macro_targets(daily_cal, dietary_type)

        height_m = max(1.0, height / 100.0)
        bmi = round(weight / (height_m ** 2), 1)
        ibw = NutritionEngine.calculate_ideal_body_weight(gender, height)

        return {
            "bmr": bmr,
            "tdee": tdee,
            "bmi": bmi,
            "ibw": ibw,
            "dailyCalories": daily_cal,
            "targetProtein": macros["protein"],
            "targetCarbs": macros["carbs"],
            "targetFat": macros["fat"],
            "macroSplit": macros
        }
