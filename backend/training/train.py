import json
import os
import sys
import datetime
import pandas as pd
import numpy as np
import joblib
from sklearn.neighbors import NearestNeighbors

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


# Add parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.ml.feature_engineering import RecipeFeaturePipeline

def train_model(data_dir: str, model_dir: str, model_version: str = "meal-mate-v1"):
    print("=" * 60)
    print("🚀 TRAINING MEAL MATE RECOMMENDATION MODEL")
    print("=" * 60)

    cleaned_json = os.path.join(data_dir, "cleaned_recipes.json")
    if not os.path.exists(cleaned_json):
        print(f"❌ Error: {cleaned_json} not found. Please run training/preprocess.py first.")
        return

    with open(cleaned_json, "r", encoding="utf-8") as f:
        recipes = json.load(f)

    print(f"Loaded {len(recipes)} cleaned recipes for model training.")

    # 1. Feature Engineering & Scaling
    pipeline = RecipeFeaturePipeline()
    scaled_features, raw_features_df = pipeline.fit_transform(recipes)

    print(f"Feature matrix shape: {scaled_features.shape}")
    print(f"Total features extracted: {len(pipeline.feature_columns)}")

    # Save feature matrix to CSV
    os.makedirs(data_dir, exist_ok=True)
    features_csv_path = os.path.join(data_dir, "recipe_features.csv")
    features_df = pd.DataFrame(scaled_features, columns=pipeline.feature_columns)
    features_df.insert(0, "recipeName", [r["recipeName"] for r in recipes])
    features_df.insert(0, "id", [r["id"] for r in recipes])
    features_df.to_csv(features_csv_path, index=False, encoding="utf-8")
    print(f"✅ Saved scaled recipe features to: {features_csv_path}")

    # 2. Train Nearest Neighbors Recommender (Cosine Similarity Metric)
    # n_neighbors=30 to retrieve robust candidate pools for the optimizer
    k_neighbors = min(30, len(recipes))
    knn = NearestNeighbors(n_neighbors=k_neighbors, metric="cosine", algorithm="brute")
    knn.fit(scaled_features)

    # 3. Create ID Lookup Dicts
    recipe_id_to_idx = {r["id"]: idx for idx, r in enumerate(recipes)}
    idx_to_recipe = {idx: r for idx, r in enumerate(recipes)}

    # 4. Serialize Model Artifact
    os.makedirs(model_dir, exist_ok=True)
    model_bundle = {
        "model_version": model_version,
        "trained_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "knn_model": knn,
        "feature_pipeline": pipeline,
        "feature_columns": pipeline.feature_columns,
        "recipes": recipes,
        "recipe_id_to_idx": recipe_id_to_idx,
        "idx_to_recipe": idx_to_recipe,
        "num_recipes": len(recipes),
        "k_neighbors": k_neighbors,
    }

    model_path = os.path.join(model_dir, "meal_mate_recommender.joblib")
    joblib.dump(model_bundle, model_path)
    print(f"✅ Trained model successfully saved to: {model_path}")
    print("=" * 60)

    return model_path

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    model_dir = os.path.join(base_dir, "models")
    train_model(data_dir, model_dir)
