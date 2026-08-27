from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from app.core.deps import get_optional_user, get_current_user
from app.services.nutrition_service import NutritionEngine
from app.services.meal_plan_service import meal_plan_service
from app.schemas.meal_plan import MealPlanResponse

router = APIRouter(prefix="/api/planners", tags=["Specialized Goal Planners & AI Nutrition Guide"])

class GoalPlannerRequest(BaseModel):
    age: int = Field(25, ge=10, le=100, description="Age in years")
    gender: str = Field("male", description="'male' or 'female'")
    weight: float = Field(70.0, ge=30, le=300, description="Weight in kg")
    height: float = Field(175.0, ge=100, le=250, description="Height in cm")
    activityLevel: str = Field("moderate", description="'sedentary', 'light', 'moderate', 'active', 'very_active'")
    dietaryType: Optional[str] = Field("desi", description="'desi', 'keto', 'high_protein', 'vegetarian', 'vegan', 'balanced'")
    days: int = Field(7, ge=1, le=14, description="Number of days (1 to 14)")
    mealsPerDay: int = Field(3, ge=2, le=5, description="Meals per day (2 to 5)")
    allergies: Optional[List[str]] = Field(default_factory=list)
    restrictions: Optional[List[str]] = Field(default_factory=list)
    lang: Optional[str] = Field("en", description="'en' for English, 'ur' for Urdu")

class NutritionGuideRequest(BaseModel):
    age: int = Field(..., ge=10, le=100)
    gender: str = Field("male", description="'male' or 'female'")
    weight: float = Field(..., ge=30, le=300, description="Weight in kg")
    height: float = Field(..., ge=100, le=250, description="Height in cm")
    activityLevel: str = Field("moderate", description="'sedentary', 'light', 'moderate', 'active', 'very_active'")
    weightGoal: str = Field("weight_loss", description="'weight_loss', 'weight_gain', 'maintenance'")
    dietaryType: str = Field("desi", description="'desi', 'keto', 'high_protein', 'vegetarian', 'balanced'")
    lang: str = Field("en", description="'en' for English, 'ur' for Urdu")

def localize_recipe_item(recipe: Dict[str, Any], lang: str = "en") -> Dict[str, Any]:
    r = recipe.copy()
    if lang == "ur":
        # Format ingredients with Urdu names where available
        if isinstance(r.get("ingredients"), list):
            r["ingredients_localized"] = [
                f"{ing.get('urduName', ing.get('englishName', ''))} - {ing.get('quantity', '')}"
                if isinstance(ing, dict) else str(ing)
                for ing in r.get("ingredients", [])
            ]
    return r

@router.post("/weight-loss", response_model=MealPlanResponse, summary="Weight Loss & Cutting Planner (Fat Loss Focus)")
def generate_weight_loss_plan(
    req: GoalPlannerRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """
    🎯 **Weight Loss / Cutting Planner**:
    - Calculates scientific calorie deficit: **TDEE - 500 kcal** (safe ~0.5kg/week fat loss).
    - Prioritizes high-satiety, thermogenic, high-protein & high-fiber recipes.
    - Zero allergy violations and 100% multi-day recipe variety.
    """
    user_id = current_user.get("id") if current_user else None
    profile = NutritionEngine.compute_full_profile(
        gender=req.gender,
        age=req.age,
        weight=req.weight,
        height=req.height,
        activity_level=req.activityLevel,
        weight_goal="weight_loss",
        dietary_type=req.dietaryType or "high_protein"
    )

    from app.schemas.meal_plan import MealPlanRequest
    plan_req = MealPlanRequest(
        days=req.days,
        mealsPerDay=req.mealsPerDay,
        dailyCalories=profile["dailyCalories"],
        protein=profile["targetProtein"],
        carbs=profile["targetCarbs"],
        fat=profile["targetFat"],
        dietaryType=req.dietaryType or "high_protein",
        weightGoal="weight_loss",
        allergies=req.allergies,
        restrictions=req.restrictions
    )
    return meal_plan_service.generate_plan(plan_req, user_id=user_id)

@router.post("/bulker", response_model=MealPlanResponse, summary="Bulker & Muscle Gain Planner (Calorie Surplus)")
def generate_bulker_plan(
    req: GoalPlannerRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """
    💪 **Bulker & Weight Gain Planner**:
    - Calculates optimal muscle-building surplus: **TDEE + 500 kcal to +600 kcal**.
    - High-protein macro targets (2.0g per kg bodyweight) + nutrient-dense complex carbs and healthy fats.
    - Features clean calorie-dense recipes (Desi protein dishes, chicken/beef roasts, dry fruits, energy shakes).
    """
    user_id = current_user.get("id") if current_user else None
    profile = NutritionEngine.compute_full_profile(
        gender=req.gender,
        age=req.age,
        weight=req.weight,
        height=req.height,
        activity_level=req.activityLevel,
        weight_goal="weight_gain",
        dietary_type=req.dietaryType or "desi"
    )

    from app.schemas.meal_plan import MealPlanRequest
    plan_req = MealPlanRequest(
        days=req.days,
        mealsPerDay=req.mealsPerDay,
        dailyCalories=profile["dailyCalories"],
        protein=profile["targetProtein"],
        carbs=profile["targetCarbs"],
        fat=profile["targetFat"],
        dietaryType=req.dietaryType or "desi",
        weightGoal="weight_gain",
        allergies=req.allergies,
        restrictions=req.restrictions
    )
    return meal_plan_service.generate_plan(plan_req, user_id=user_id)

@router.post("/healthy-diet", response_model=MealPlanResponse, summary="Clean & Healthy Maintenance Planner")
def generate_healthy_diet_plan(
    req: GoalPlannerRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """
    🥗 **Healthy Maintenance & Clean Diet Planner**:
    - Calculates true maintenance energy needs (**100% TDEE**).
    - Balanced macro split (45% Carbs, 25% Protein, 30% Healthy Fats) prioritizing whole foods, vitamins & minerals.
    - Mediterranean, Vegetarian, Desi, or Balanced options.
    """
    user_id = current_user.get("id") if current_user else None
    profile = NutritionEngine.compute_full_profile(
        gender=req.gender,
        age=req.age,
        weight=req.weight,
        height=req.height,
        activity_level=req.activityLevel,
        weight_goal="maintenance",
        dietary_type=req.dietaryType or "balanced"
    )

    from app.schemas.meal_plan import MealPlanRequest
    plan_req = MealPlanRequest(
        days=req.days,
        mealsPerDay=req.mealsPerDay,
        dailyCalories=profile["dailyCalories"],
        protein=profile["targetProtein"],
        carbs=profile["targetCarbs"],
        fat=profile["targetFat"],
        dietaryType=req.dietaryType or "balanced",
        weightGoal="maintenance",
        allergies=req.allergies,
        restrictions=req.restrictions
    )
    return meal_plan_service.generate_plan(plan_req, user_id=user_id)

@router.post("/guide", summary="AI Comprehensive Nutrition & Calorie Guider (Bilingual English & Urdu)")
def get_nutrition_guide(req: NutritionGuideRequest):
    """
    📖 **AI Nutrition Guider**:
    Provides an in-depth breakdown of BMI, BMR, TDEE, target calories, macro distributions, daily water intake,
    meal-by-meal calorie allocations, and customized nutritional tips in both **English** and **Urdu (اردو میں مکمل غذائی رہنمائی)**.
    """
    height_m = req.height / 100.0
    bmi = req.weight / (height_m * height_m)

    if bmi < 18.5:
        bmi_cat_en = "Underweight"
        bmi_cat_ur = "کم وزن (Underweight)"
    elif bmi < 25.0:
        bmi_cat_en = "Normal Weight"
        bmi_cat_ur = "معمول کا وزن (Normal Weight)"
    elif bmi < 30.0:
        bmi_cat_en = "Overweight"
        bmi_cat_ur = "زیادہ وزن (Overweight)"
    else:
        bmi_cat_en = "Obese"
        bmi_cat_ur = "موٹاپا (Obese)"

    profile = NutritionEngine.compute_full_profile(
        gender=req.gender,
        age=req.age,
        weight=req.weight,
        height=req.height,
        activity_level=req.activityLevel,
        weight_goal=req.weightGoal,
        dietary_type=req.dietaryType
    )

    daily_cals = profile["dailyCalories"]
    # Daily Water intake rule of thumb: ~35ml per kg bodyweight
    water_litres = round((req.weight * 0.035) + (0.5 if req.activityLevel in ["active", "very_active"] else 0.0), 1)

    # Meal distribution (Breakfast: 25%, Lunch: 35%, Dinner: 30%, Snack: 10%)
    meal_allocations = {
        "breakfast": round(daily_cals * 0.25, 1),
        "lunch": round(daily_cals * 0.35, 1),
        "dinner": round(daily_cals * 0.30, 1),
        "snack": round(daily_cals * 0.10, 1)
    }

    # Bilingual Nutrition Tips
    if req.weightGoal == "weight_loss":
        tips_en = [
            "Maintain a steady 500 kcal deficit to lose approximately 0.5 kg of body fat per week safely.",
            "Prioritize protein in every meal (eggs, chicken breast, lentils, fish) to preserve lean muscle mass.",
            f"Drink at least {water_litres} Liters of water daily, especially 1 glass before meals to control appetite.",
            "Avoid sugary beverages and refined carbs; replace them with high-fiber vegetables."
        ]
        tips_ur = [
            "وزن کم کرنے کے لیے روزانہ 500 کیلوریز کا خسارہ (Deficit) برقرار رکھیں تاکہ ہر ہفتے محفوظ طریقے سے 0.5 کلو چربی کم ہو۔",
            "ہر کھانے میں پروٹین (انڈے، چکن، دالیں، مچھلی) کو ترجیح دیں تاکہ پٹھے (muscles) محفوظ رہیں۔",
            f"روزانہ کم از کم {water_litres} لیٹر پانی ضرور پیئیں، خاص طور پر کھانے سے پہلے ایک گلاس پانی پیئیں۔",
            "میٹھے مشروبات اور چینی سے پرہیز کریں اور سلاد و سبزیوں کا استعمال بڑھائیں۔"
        ]
    elif req.weightGoal == "weight_gain":
        tips_en = [
            "Consume a 500 kcal surplus daily to promote healthy muscle growth without excessive fat accumulation.",
            "Eat nutrient and calorie-dense healthy foods like almonds, walnuts, peanut butter, eggs, chicken, and milk shakes.",
            "Have 4 to 5 smaller meals spread across the day rather than 2 huge meals.",
            f"Stay hydrated with at least {water_litres} Liters of fluid intake per day."
        ]
        tips_ur = [
            "وزن اور پٹھے بڑھانے کے لیے روزانہ 500 کیلوریز کا اضافی اضافہ (Surplus) لیں۔",
            "غذائیت سے بھرپور اور زیادہ کیلوریز والی غذائیں کھائیں جیسے بادام، اخروٹ، پی نٹ بٹر، انڈے، چکن اور شیکس۔",
            "دن میں 2 بڑے کھانوں کے بجائے 4 سے 5 چھوٹے کھانے کھائیں۔",
            f"روزانہ کم از کم {water_litres} لیٹر پانی اور صحت مند مشروبات پیئیں۔"
        ]
    else:
        tips_en = [
            "Consume your exact TDEE calories to maintain your current weight and healthy body composition.",
            "Focus on clean micronutrient-dense whole foods: colorful vegetables, whole grains, and lean proteins.",
            f"Maintain hydration with {water_litres} Liters of water daily.",
            "Keep an active routine with 30-45 minutes of moderate daily exercise."
        ]
        tips_ur = [
            "اپنا موجودہ وزن برقرار رکھنے کے لیے روزانہ اپنی ضرورت (TDEE) کے مطابق کیلوریز کھائیں۔",
            "صحت بخش اور قدرتی کھانوں پر توجہ دیں: رنگ برنگی سبزیاں، دالیں اور خالص پروٹین۔",
            f"روزانہ {water_litres} لیٹر پانی پینے کا معمول بنائیں۔",
            "روزانہ 30 سے 45 منٹ کی معتدل ورزش یا چہل قدمی کریں۔"
        ]

    return {
        "success": True,
        "language": req.lang,
        "biometrics": {
            "age": req.age,
            "gender": req.gender,
            "weightKg": req.weight,
            "heightCm": req.height,
            "bmi": round(bmi, 2),
            "bmiCategory": bmi_cat_ur if req.lang == "ur" else bmi_cat_en,
            "bmr": profile["bmr"],
            "tdee": profile["tdee"]
        },
        "dailyCalorieTarget": daily_cals,
        "dailyWaterIntakeLitres": water_litres,
        "macroNutrients": {
            "proteinGrams": profile["targetProtein"],
            "carbsGrams": profile["targetCarbs"],
            "fatGrams": profile["targetFat"]
        },
        "mealCalorieDistribution": meal_allocations,
        "nutritionGuidance": tips_ur if req.lang == "ur" else tips_en,
        "nutritionGuidanceBilingual": {
            "english": tips_en,
            "urdu": tips_ur
        }
    }
