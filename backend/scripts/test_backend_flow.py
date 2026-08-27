import os
import sys
import datetime
import httpx
import pytest

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_backend_suite():
    print("=" * 70)
    print("🧪 RUNNING COMPREHENSIVE MEAL MATE BACKEND INTEGRATION TEST SUITE")
    print("=" * 70)

    # 1. Health Check
    print("\n--- 1. Health Check ---")
    resp = client.get("/health")
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    print("✅ Health Check passed:", resp.json())

    # 2. Authentication: Signup
    print("\n--- 2. User Signup ---")
    unique_suffix = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    test_email = f"tester_{unique_suffix}@mealmates.ai"
    test_user = f"tester_{unique_suffix}"
    
    signup_payload = {
        "username": test_user,
        "email": test_email,
        "password": "Password123!"
    }
    resp = client.post("/api/auth/signup", json=signup_payload)
    assert resp.status_code == 201, f"Signup failed: {resp.text}"
    auth_data = resp.json()
    token = auth_data["token"]
    user_id = auth_data["user"]["id"]
    print(f"✅ User Signup passed: User ID = {user_id}, Token generated.")

    auth_headers = {"Authorization": f"Bearer {token}"}

    # 3. Authentication: Login
    print("\n--- 3. User Login ---")
    login_payload = {
        "email": test_email,
        "password": "Password123!"
    }
    resp = client.post("/api/auth/login", json=login_payload)
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    print("✅ User Login passed.")

    # 4. Authentication: Get Current User (/api/auth/me)
    print("\n--- 4. Current User Verification (/api/auth/me) ---")
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200, f"Me endpoint failed: {resp.text}"
    print("✅ Get Current User passed:", resp.json()["username"])

    # 5. User Profile: Calculate and Save Calories
    print("\n--- 5. Calculate Daily Calories (Mifflin-St Jeor) ---")
    cal_payload = {
        "gender": "male",
        "age": 28,
        "weight": 75.0,
        "height": 178.0,
        "activityLevel": "moderate",
        "weightGoal": "weight_loss"
    }
    resp = client.post("/api/users/calories", json=cal_payload, headers=auth_headers)
    assert resp.status_code == 200, f"Calorie calculation failed: {resp.text}"
    cal_res = resp.json()
    daily_cals = cal_res["dailyCalories"]
    print(f"✅ Daily Calories Calculated & Saved: {daily_cals} kcal (BMR: {cal_res['bmr']:.1f}, TDEE: {cal_res['tdee']:.1f})")

    # 6. Specialized Goal Planner: Weight Loss / Cutting
    print("\n--- 6. Weight Loss / Cutting Planner ---")
    wl_payload = {
        "age": 28,
        "gender": "male",
        "weight": 75.0,
        "height": 178.0,
        "activityLevel": "moderate",
        "dietaryType": "high_protein",
        "days": 3,
        "mealsPerDay": 3
    }
    resp = client.post("/api/planners/weight-loss", json=wl_payload, headers=auth_headers)
    assert resp.status_code == 200, f"Weight loss planner failed: {resp.text}"
    wl_plan = resp.json()
    print(f"✅ Weight Loss Plan generated: Target {wl_plan['targetCalories']} kcal, {len(wl_plan['days'])} days scheduled.")

    # 7. Specialized Goal Planner: Bulker / Muscle Gain
    print("\n--- 7. Bulker / Muscle Gain Planner ---")
    bulk_payload = {
        "age": 24,
        "gender": "male",
        "weight": 68.0,
        "height": 175.0,
        "activityLevel": "active",
        "dietaryType": "desi",
        "days": 3,
        "mealsPerDay": 3
    }
    resp = client.post("/api/planners/bulker", json=bulk_payload, headers=auth_headers)
    assert resp.status_code == 200, f"Bulker planner failed: {resp.text}"
    bulk_plan = resp.json()
    print(f"✅ Bulker Plan generated: Target {bulk_plan['targetCalories']} kcal (Calorie Surplus).")

    # 8. Specialized Goal Planner: Clean & Healthy Diet
    print("\n--- 8. Healthy Maintenance Diet Planner ---")
    health_payload = {
        "age": 30,
        "gender": "female",
        "weight": 60.0,
        "height": 165.0,
        "activityLevel": "moderate",
        "dietaryType": "balanced",
        "days": 3,
        "mealsPerDay": 3
    }
    resp = client.post("/api/planners/healthy-diet", json=health_payload, headers=auth_headers)
    assert resp.status_code == 200, f"Healthy diet planner failed: {resp.text}"
    health_plan = resp.json()
    print(f"✅ Healthy Diet Plan generated: Target {health_plan['targetCalories']} kcal (100% TDEE).")

    # 9. Bilingual AI Nutrition Guider (Urdu & English)
    print("\n--- 9. Bilingual AI Nutrition Guider (Urdu & English) ---")
    guide_payload = {
        "age": 26,
        "gender": "male",
        "weight": 82.0,
        "height": 175.0,
        "activityLevel": "moderate",
        "weightGoal": "weight_loss",
        "dietaryType": "desi",
        "lang": "ur"
    }
    resp = client.post("/api/planners/guide", json=guide_payload)
    assert resp.status_code == 200, f"Nutrition guide failed: {resp.text}"
    guide_res = resp.json()
    print(f"✅ AI Nutrition Guide passed: BMI = {guide_res['biometrics']['bmi']} ({guide_res['biometrics']['bmiCategory']}), Water = {guide_res['dailyWaterIntakeLitres']}L")
    print(f"   • Urdu Tip: {guide_res['nutritionGuidance'][0]}")

    # 10. AI Single-Slot Recommendation
    print("\n--- 10. AI Single-Slot Recipe Recommendation ---")
    rec_payload = {
        "mealType": "breakfast",
        "targetCalories": 450.0,
        "dietaryType": "keto",
        "topK": 3
    }
    resp = client.post("/api/recommendations", json=rec_payload)
    assert resp.status_code == 200, f"Recommendation failed: {resp.text}"
    rec_data = resp.json()
    print(f"✅ AI Recommendation passed: {rec_data['count']} Keto Breakfasts found.")

    # 11. Custom Ingredient Search
    print("\n--- 11. Custom Ingredient & Restriction Search ---")
    ing_payload = {
        "ingredient": "egg",
        "restrictions": ["dairy_free"],
        "save": True
    }
    resp = client.post("/api/custom-meals/ingredient-search", json=ing_payload, headers=auth_headers)
    assert resp.status_code == 200, f"Ingredient search failed: {resp.text}"
    ing_res = resp.json()
    print(f"✅ Ingredient Search passed: Found '{ing_res['meal']['recipeName']}' ({ing_res['meal']['calories']} kcal).")

    # 12. Feedback Submission
    print("\n--- 12. Submit User Feedback ---")
    fb_payload = {
        "message": "The bilingual Urdu guidance and bulker planner work wonderfully!",
        "rating": 5,
        "category": "meal_plan"
    }
    resp = client.post("/api/feedback", json=fb_payload, headers=auth_headers)
    assert resp.status_code == 201, f"Feedback failed: {resp.text}"
    print("✅ Feedback Submission passed.")

    # 13. Google Auth Simulation
    print("\n--- 13. Google Sign-In & Avatar Sync ---")
    google_payload = {
        "email": f"google_{unique_suffix}@gmail.com",
        "displayName": "Google Tester",
        "photoURL": "https://lh3.googleusercontent.com/a/default-user=s96-c"
    }
    resp = client.post("/api/auth/google", json=google_payload)
    assert resp.status_code == 200, f"Google auth failed: {resp.text}"
    google_res = resp.json()
    print(f"✅ Google Auth passed: Avatar synced -> {google_res['user']['profileImage']}")

    print("\n" + "=" * 70)
    print("🎉 ALL 13 COMPREHENSIVE INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    test_full_backend_suite()
