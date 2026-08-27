# Meal Mate — ML Model Training & FastAPI Guide

## 1. Goal

This document defines the first development phase of Meal Mate:

1. Prepare `recipes.json`
2. Clean and validate the recipe dataset
3. Engineer nutrition and preference features
4. Build a content-based recommendation model
5. Build meal-plan optimization
6. Expose recommendations through FastAPI
7. Test the ML service independently

> Scope: **ML model + FastAPI only**.
>
> Frontend (Next.js), Flutter, Firebase integration, and production deployment will be handled in later phases.

---

# 2. Recommended ML Architecture

```text
                    recipes.json
                         |
                         v
                Data Preprocessing
                         |
                         v
                 Feature Engineering
                         |
                         v
              Recipe Feature Matrix
                         |
                         v
              KNN / Cosine Similarity
                         |
                         v
                 Ranked Recipes
                         |
                         v
              Meal Plan Optimizer
                         |
                         v
                 Final Meal Plan
                         |
                         v
                      FastAPI
                         |
                         v
                 /recommendations
                 /meal-plans/generate
```

---

# 3. Why This Model

The initial Meal Mate dataset is a recipe dataset, not a large historical user-rating dataset.

Therefore, the first version should **not** use a supervised neural network or Random Forest to predict a recipe.

Instead, use:

- Content-based recommendation
- K-Nearest Neighbors (KNN)
- Cosine similarity
- Nutritional feature vectors
- Hard dietary/allergy filtering
- Meal-plan optimization

Later, after collecting real user interactions, Meal Mate can evolve into a hybrid recommender.

---

# 4. Technology Stack

| Component | Technology |
|---|---|
| Language | Python |
| API | FastAPI |
| ML | Scikit-learn |
| Data | Pandas |
| Numerical Processing | NumPy |
| Model Serialization | Joblib |
| Dataset | JSON |
| API Testing | Swagger / OpenAPI |
| Server | Uvicorn |

---

# 5. Backend Directory Structure

```text
backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── recommendations.py
│   │   ├── meal_plans.py
│   │   └── health.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── recommendation.py
│   │   └── meal_plan.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── recommendation_service.py
│   │   ├── nutrition_service.py
│   │   └── meal_plan_service.py
│   │
│   └── ml/
│       ├── __init__.py
│       ├── feature_engineering.py
│       ├── recommender.py
│       ├── optimizer.py
│       └── model_loader.py
│
├── data/
│   ├── recipes.json
│   ├── cleaned_recipes.json
│   └── recipe_features.csv
│
├── training/
│   ├── inspect_dataset.py
│   ├── preprocess.py
│   ├── train.py
│   └── evaluate.py
│
├── models/
│   └── meal_mate_recommender.joblib
│
├── requirements.txt
├── .env
├── .gitignore
└── README.md
```

---

# 6. Python Environment

Create a virtual environment:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install fastapi uvicorn pandas numpy scikit-learn joblib python-dotenv pydantic
```

Save them:

```bash
pip freeze > requirements.txt
```

---

# 7. Dataset Requirements

The existing `recipes.json` is the source dataset.

The exact structure must be inspected before building the final feature pipeline.

The preferred recipe structure is approximately:

```json
{
  "id": "recipe_001",
  "name": "Chicken Rice Bowl",
  "mealType": "lunch",
  "dietaryType": "high_protein",
  "calories": 650,
  "protein": 45,
  "carbs": 65,
  "fat": 18,
  "fiber": 7,
  "ingredients": [
    "chicken",
    "rice",
    "vegetables"
  ],
  "allergens": [],
  "tags": [
    "high_protein",
    "muscle_gain"
  ]
}
```

The actual project should adapt to the real fields in `recipes.json`.

---

# 8. Dataset Inspection

Before training anything, inspect:

- Number of recipes
- Duplicate recipes
- Missing values
- Missing nutritional values
- Different spellings of meal types
- Different spellings of dietary types
- Invalid calories
- Invalid macro values
- Missing ingredients
- Missing allergy information

Example command:

```bash
python training/inspect_dataset.py
```

The inspection script should report:

```text
Total recipes: 1200

Missing calories: 4
Missing protein: 11
Missing carbs: 8
Missing fat: 6

Duplicate recipes: 12

Meal types:
breakfast: 300
lunch: 350
dinner: 380
snack: 170
```

Do not train the model until the dataset has been inspected.

---

# 9. Data Cleaning

Create:

```text
data/cleaned_recipes.json
```

Cleaning should include:

### Text normalization

Convert:

```text
"Breakfast"
"BREAKFAST"
"break fast"
```

into:

```text
breakfast
```

### Dietary normalization

For example:

```text
"High Protein"
"high-protein"
"high protein"
```

becomes:

```text
high_protein
```

### Numeric validation

Calories, protein, carbohydrates, fat, and fiber must be numeric.

Invalid values should be corrected, removed, or marked as missing.

---

# 10. Nutrition Feature Engineering

Raw nutritional values are useful, but ratios are also important.

For each recipe calculate:

```text
protein_ratio
carb_ratio
fat_ratio
```

A simple normalized representation can be:

```text
protein / calories
carbs / calories
fat / calories
```

These features help compare recipes with different serving sizes.

Do not assume the dataset is nutritionally complete; missing values must be handled explicitly.

---

# 11. Recipe Feature Vector

A recipe should eventually be represented by a numerical vector such as:

```text
[
  calories,
  protein,
  carbs,
  fat,
  fiber,
  protein_ratio,
  carb_ratio,
  fat_ratio,
  meal_type_features,
  dietary_features,
  restriction_features
]
```

Categorical values should be encoded using appropriate techniques such as one-hot encoding.

---

# 12. Feature Scaling

Nutrition values have very different ranges.

For example:

```text
Calories = 650
Protein = 45
Fat = 18
```

Without scaling, calories can dominate similarity calculations.

Use:

```python
StandardScaler
```

or another suitable scaler.

The scaler must be fitted during training and saved together with the model.

---

# 13. Recommendation Model

The first model should use KNN as a nearest-neighbor recommender.

Conceptually:

```text
User Target Vector
        |
        v
Feature Scaler
        |
        v
KNN
        |
        v
Nearest Recipe Vectors
        |
        v
Top-K Recipes
```

KNN is used here primarily to retrieve similar recipes, not as a traditional classification model.

---

# 14. User Preference Vector

The user profile should eventually provide:

```json
{
  "age": 24,
  "gender": "male",
  "weight": 75,
  "height": 178,
  "activityLevel": "moderate",
  "goal": "muscle_gain",
  "diet": "high_protein",
  "allergies": ["peanuts"],
  "dislikes": ["fish"]
}
```

The nutrition service calculates the user's targets.

Example:

```text
Target calories: 2700
Target protein: 170g
Target carbs: 300g
Target fat: 80g
```

These targets are used to construct the recommendation vector.

---

# 15. Keep Nutrition Calculation Separate

Do not make the ML model responsible for calculating calories.

Use:

```text
User Profile
     |
     v
Mifflin-St Jeor
     |
     v
BMR
     |
     v
TDEE
     |
     v
Goal Adjustment
     |
     v
Target Calories
     |
     v
Target Macros
```

Then the recommender answers:

> Which recipes best satisfy these targets?

This separation makes the system easier to test and maintain.

---

# 16. Hard Constraints

ML must never override safety or explicit user restrictions.

Apply hard filtering before recommendation.

Example:

```text
User allergy = peanuts
```

First remove recipes containing peanuts or known peanut-related ingredients.

Then:

```text
Safe recipes
     |
     v
ML ranking
```

Hard constraints can include:

- Allergies
- Dietary type
- Required meal type
- Explicit exclusions
- Other application-defined safety rules

---

# 17. Recommendation Pipeline

The final recommendation flow should be:

```text
User Profile
     |
     v
Nutrition Calculator
     |
     v
Target Calories + Macros
     |
     v
Hard Constraint Filtering
     |
     v
Feature Engineering
     |
     v
Scaling
     |
     v
KNN / Similarity
     |
     v
Top-K Candidate Recipes
```

---

# 18. Why Top-K Is Important

Do not immediately select one recipe.

For example:

```text
Top 10 candidates

1. Chicken Bowl
2. Chicken Wrap
3. Turkey Rice
4. Beef Bowl
5. Egg Rice
6. Lentil Bowl
7. Chicken Pasta
8. Tuna Rice
9. Greek Yogurt Bowl
10. Chicken Salad
```

The meal-plan optimizer can then choose combinations from these candidates.

---

# 19. Meal Plan Optimization

Recommendation and meal planning are two different problems.

### Recommendation

Answers:

> Which recipes are suitable?

### Optimization

Answers:

> Which combination of recipes best satisfies the user's daily nutritional target?

The optimizer should minimize a score such as:

```text
Score =
    calorie_error
  + protein_error
  + carb_error
  + fat_error
  + repetition_penalty
```

Subject to:

```text
allergies satisfied
diet satisfied
meal types satisfied
reasonable meal distribution
```

---

# 20. Meal Distribution

Do not hard-code the old simplistic system permanently.

Instead of blindly doing:

```text
Breakfast = 25%
Lunch = 30%
Dinner = 30%
Snack = 15%
```

use configurable meal targets.

For example:

```text
Breakfast: 20–30%
Lunch:     25–35%
Dinner:    25–35%
Snack:     10–20%
```

The optimizer can select the best combination within reasonable ranges.

---

# 21. No Artificial Recipe Scaling

The old behavior:

```text
Avocado Salad
2.5 servings
```

should not be the primary mechanism for hitting calorie targets.

Prefer:

```text
Breakfast recipe A
Lunch recipe B
Snack recipe C
Dinner recipe D
```

If serving-size information exists in the dataset, it can be handled explicitly.

Do not invent fractional servings merely to force mathematical calorie equality.

---

# 22. Variety

The optimizer should penalize repeated recipes.

Example:

```text
Monday:
Chicken Bowl

Tuesday:
Chicken Wrap

Wednesday:
Beef Rice

Thursday:
Lentil Bowl
```

rather than:

```text
Monday:
Chicken Bowl

Tuesday:
Chicken Bowl

Wednesday:
Chicken Bowl
```

Later, variety can include:

- Different cuisines
- Different protein sources
- Different vegetables
- Different recipe categories

---

# 23. Model Training

Training should produce a reusable model artifact.

Pipeline:

```text
recipes.json
      |
      v
preprocess.py
      |
      v
cleaned dataset
      |
      v
feature_engineering.py
      |
      v
feature matrix
      |
      v
scaler + KNN
      |
      v
meal_mate_recommender.joblib
```

Save:

```text
models/meal_mate_recommender.joblib
```

The API loads this model when it starts.

---

# 24. What Gets Saved

The model artifact should contain everything required for inference, such as:

```text
KNN model
Feature scaler
Feature encoder
Feature column order
Recipe IDs
```

This avoids training again every time FastAPI starts.

---

# 25. Model Evaluation

Because this is a recommendation system, do not only report "accuracy".

Evaluate:

### Nutrition error

```text
Absolute calorie error
Protein error
Carbohydrate error
Fat error
```

### Recommendation quality

Later:

```text
Precision@K
Recall@K
NDCG@K
```

### Meal-plan quality

Measure:

```text
Average calorie deviation
Average protein deviation
Macro deviation
Restriction violations
Recipe repetition
```

A critical requirement:

```text
Restriction violations = 0
```

---

# 26. FastAPI Architecture

FastAPI will expose the trained recommendation system.

```text
Client
  |
  v
FastAPI
  |
  +--> Nutrition Service
  |
  +--> Recommendation Service
  |
  +--> Meal Plan Optimizer
  |
  +--> Model
```

---

# 27. FastAPI Endpoints

Initial endpoints:

```http
GET /health
```

```http
POST /api/recommendations
```

```http
POST /api/meal-plans/generate
```

Later:

```http
GET /api/recipes
GET /api/recipes/{recipe_id}
POST /api/feedback
```

Firebase integration will be added in a later phase.

---

# 28. Health Endpoint

The API should first have:

```http
GET /health
```

Expected response:

```json
{
  "status": "ok",
  "service": "meal-mate-ml"
}
```

This confirms that FastAPI is running.

---

# 29. Recommendation Endpoint

Example request:

```json
{
  "dailyCalories": 2700,
  "protein": 170,
  "carbs": 300,
  "fat": 80,
  "mealType": "lunch",
  "dietaryType": "high_protein",
  "allergies": ["peanuts"],
  "dislikes": ["fish"],
  "topK": 10
}
```

Example response:

```json
{
  "recommendations": [
    {
      "recipeId": "recipe_001",
      "name": "Chicken Rice Bowl",
      "score": 0.94
    },
    {
      "recipeId": "recipe_017",
      "name": "Chicken Wrap",
      "score": 0.91
    }
  ]
}
```

---

# 30. Meal Plan Endpoint

Example:

```http
POST /api/meal-plans/generate
```

Request:

```json
{
  "dailyCalories": 2700,
  "protein": 170,
  "carbs": 300,
  "fat": 80,
  "days": 7,
  "mealsPerDay": 4,
  "dietaryType": "high_protein",
  "allergies": ["peanuts"],
  "dislikes": ["fish"]
}
```

Response:

```json
{
  "modelVersion": "meal-mate-v1",
  "targetCalories": 2700,
  "targetProtein": 170,
  "targetCarbs": 300,
  "targetFat": 80,
  "days": [
    {
      "day": 1,
      "meals": []
    },
    {
      "day": 2,
      "meals": []
    }
  ]
}
```

---

# 31. FastAPI Request Flow

```text
POST /api/meal-plans/generate
                |
                v
          Validate request
                |
                v
        Calculate/verify targets
                |
                v
        Load recipe candidates
                |
                v
        Apply hard constraints
                |
                v
       Generate user vector
                |
                v
        KNN recommendation
                |
                v
       Select Top-K candidates
                |
                v
       Meal-plan optimization
                |
                v
           Validate plan
                |
                v
             Response
```

---

# 32. Model Loading

FastAPI should load the trained model once during application startup.

Do not do:

```text
Every request
    |
    v
Train model
```

Instead:

```text
FastAPI starts
    |
    v
Load model
    |
    v
Keep model in memory
    |
    v
Handle requests
```

This is significantly faster.

---

# 33. API Validation

Use Pydantic schemas.

Validate:

```text
age
weight
height
daily calories
macro values
goal
diet
meal count
days
```

Reject invalid requests before running ML.

---

# 34. Error Handling

The API should handle:

### No recipes available

```json
{
  "error": "No suitable recipes found"
}
```

### Invalid nutrition target

```json
{
  "error": "Invalid nutritional target"
}
```

### Dataset problem

Return an internal error while logging the actual problem server-side.

Do not expose stack traces to users.

---

# 35. Logging

Log:

```text
Request ID
Endpoint
Processing time
Number of candidate recipes
Recommendation model version
Optimization result
Errors
```

Avoid logging sensitive user information unnecessarily.

---

# 36. Model Versioning

Every response should identify the model:

```json
{
  "modelVersion": "meal-mate-v1"
}
```

When the model changes:

```text
meal-mate-v2
meal-mate-v3
```

This lets you compare model performance.

---

# 37. Development Milestones

## Milestone 1 — Dataset

```text
recipes.json
   ↓
Inspect
   ↓
Clean
   ↓
Validate
```

**Output:**

```text
cleaned_recipes.json
```

---

## Milestone 2 — Feature Engineering

```text
cleaned_recipes.json
   ↓
Nutrition features
   ↓
Categorical encoding
   ↓
Scaling
```

**Output:**

```text
recipe_features.csv
```

---

## Milestone 3 — Recommendation Model

```text
Feature matrix
   ↓
KNN
   ↓
Similarity
   ↓
Top-K
```

**Output:**

```text
meal_mate_recommender.joblib
```

---

## Milestone 4 — Nutrition Engine

Implement:

```text
BMR
TDEE
Calories
Protein
Carbs
Fat
```

Test independently.

---

## Milestone 5 — Meal Optimizer

Implement:

```text
Candidates
   ↓
Meal grouping
   ↓
Nutrition objective
   ↓
Variety
   ↓
Final plan
```

---

## Milestone 6 — FastAPI

Expose:

```text
/health
/recommendations
/meal-plans/generate
```

---

## Milestone 7 — Testing

Test:

```text
ML
Nutrition
API
Invalid inputs
Restriction handling
Meal-plan quality
```

Only after all of these work should we connect Firebase.

---

# 38. What We Should NOT Do Yet

Do not start these until the ML + FastAPI layer works:

- Next.js redesign
- Flutter redesign
- Firebase Firestore integration
- Firebase Authentication
- Notifications
- Production deployment
- Chatbot improvements

The first goal is:

> **Given a user profile and recipe dataset, FastAPI must reliably return a sensible personalized meal plan.**

---

# 39. Final Phase-1 Architecture

```text
                 recipes.json
                      |
                      v
              Dataset Cleaning
                      |
                      v
             Feature Engineering
                      |
                      v
              KNN Recommendation
                      |
                      v
               Top-K Recipes
                      |
                      v
             Meal Optimization
                      |
                      v
              Validated Meal Plan
                      |
                      v
                   FastAPI
                 /         \
                /           \
       /recommendations   /meal-plans/generate
```

---

# 40. Definition of Done

Phase 1 is complete only when all of these work:

- [ ] `recipes.json` successfully loads
- [ ] Dataset statistics can be generated
- [ ] Duplicates are handled
- [ ] Missing nutritional data is handled
- [ ] Meal types are normalized
- [ ] Dietary types are normalized
- [ ] Recipe features are generated
- [ ] Features are scaled
- [ ] KNN recommender is trained
- [ ] Model is saved with Joblib
- [ ] Model can be loaded without retraining
- [ ] User preference vector can be generated
- [ ] Hard restrictions are applied
- [ ] Top-K recipes can be returned
- [ ] Calorie targets can be calculated
- [ ] Macro targets can be calculated
- [ ] Meal optimizer can create a daily plan
- [ ] 7-day plan can be generated
- [ ] Fractional serving hacks are removed
- [ ] Variety is considered
- [ ] Nutrition deviation is measured
- [ ] FastAPI starts successfully
- [ ] `/health` works
- [ ] `/api/recommendations` works
- [ ] `/api/meal-plans/generate` works
- [ ] Swagger documentation works
- [ ] Invalid requests are rejected properly
- [ ] Model version is returned

---

# 41. Next Phase

After this document is implemented and tested, the next phase should be:

```text
FastAPI ML Service
        +
Firebase
        |
        +-- Firebase Authentication
        +-- Firestore
        +-- Storage
        +-- FCM
        |
        v
Next.js Web
        +
Flutter Mobile
```

The important rule is:

**Finish and validate the ML + FastAPI core first.**

Once that core is reliable, Firebase and both clients can be connected to it without changing the recommendation architecture.
