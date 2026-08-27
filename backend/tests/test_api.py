import os
import sys
import pytest
from fastapi.testclient import TestClient

# Set path to include ML directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "meal-mate-ml"
    assert "modelVersion" in data

def test_single_recommendation_endpoint():
    payload = {
        "gender": "male",
        "age": 28,
        "weight": 78.0,
        "height": 180.0,
        "activityLevel": "moderate",
        "weightGoal": "weight_loss",
        "mealType": "lunch",
        "dietaryType": "high_protein",
        "allergies": ["peanuts"],
        "topK": 5
    }
    response = client.post("/api/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["recommendations"]) <= 5
    assert data["targetCalories"] > 0

def test_meal_plan_generation_endpoint():
    payload = {
        "gender": "female",
        "age": 26,
        "weight": 62.0,
        "height": 165.0,
        "activityLevel": "light",
        "weightGoal": "weight_loss",
        "days": 3,
        "mealsPerDay": 3,
        "dietaryType": "balanced"
    }
    response = client.post("/api/meal-plans/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["daysCount"] == 3
    assert len(data["days"]) == 3
    assert len(data["days"][0]["meals"]) == 3

def test_visuals_endpoint():
    response = client.get("/api/visuals/split")
    # Should return either 200 (PNG file) or 404 if not generated yet
    assert response.status_code in [200, 404]

def test_invalid_input_validation():
    # Invalid age (outside bounds)
    payload = {
        "age": 200, # Invalid
        "weight": 70
    }
    response = client.post("/api/recommendations", json=payload)
    assert response.status_code == 422 # Pydantic Unprocessable Entity
