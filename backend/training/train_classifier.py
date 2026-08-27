import os
import sys
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import StratifiedKFold, cross_val_score, cross_val_predict
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, balanced_accuracy_score
)

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    # 1. Macronutrient Ratios
    total_macros = df["protein"] + df["carbs"] + df["fat"] + 1e-5
    df["protein_ratio"] = df["protein"] / total_macros
    df["carb_ratio"] = df["carbs"] / total_macros
    df["fat_ratio"] = df["fat"] / total_macros
    
    # 2. Time & Calorie Densities
    df["cal_per_min"] = df["calories"] / (df["preparationTime"] + 1.0)
    df["is_quick"] = (df["preparationTime"] <= 15).astype(float)
    df["is_slow"] = (df["preparationTime"] >= 35).astype(float)
    df["cals_per_serving"] = df["calories"] / (df["serves"].replace(0, 1))
    
    # 3. Micro Densities
    df["sodium_per_cal"] = df["sodium"] / (df["calories"] + 1.0)
    df["fiber_to_carb"] = df["fiber"] / (df["carbs"] + 1.0)
    
    # 4. Triple-Weighted Semantic Text
    if "semantic_text" not in df.columns:
        df["semantic_text"] = df["recipeName"] + " " + df["recipeName"] + " " + df["recipeName"] + " " + df["ingredients_str"].fillna("")

    return df

def train_production_model(data_dir: str, model_dir: str, visuals_dir: str):
    print("=" * 80)
    print("🚀 PRODUCTION CALIBRATED CLASSIFIER (HIGH GENERALIZATION)")
    print("=" * 80)

    train_csv = os.path.join(data_dir, "train_recipes.csv")
    val_csv = os.path.join(data_dir, "val_recipes.csv")
    test_csv = os.path.join(data_dir, "test_recipes.csv")

    if not os.path.exists(train_csv) or not os.path.exists(test_csv):
        print("❌ Dataset splits not found. Run training/preprocess.py first.")
        return

    train_df = pd.read_csv(train_csv)
    val_df = pd.read_csv(val_csv)
    test_df = pd.read_csv(test_csv)

    # Combine 70% Train + 10% Val for 80% Training Pool
    train_val_df = pd.concat([train_df, val_df], ignore_index=True)

    print(f"\n📊 Dataset Partition Sizes:")
    print(f"  • Training Pool (80%): {len(train_val_df)} recipes")
    print(f"  • Test Partition (20%): {len(test_df)} recipes")
    print(f"  • Total Dataset:        {len(train_val_df) + len(test_df)} recipes")

    # Feature Engineering
    train_val_eng = engineer_features(train_val_df)
    test_eng = engineer_features(test_df)

    num_cols = [
        "calories", "protein", "carbs", "fat", "fiber",
        "sodium", "preparationTime",
        "protein_ratio", "carb_ratio", "fat_ratio",
        "cal_per_min", "is_quick", "is_slow", "cals_per_serving",
        "sodium_per_cal", "fiber_to_carb"
    ]
    cat_cols = ["dietaryType", "weightGoal"]

    # Preprocessor Pipeline
    text_transformer = TfidfVectorizer(
        max_features=300,
        ngram_range=(1, 2),
        min_df=2,
        sublinear_tf=True
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("text", text_transformer, "semantic_text"),
            ("num", StandardScaler(), num_cols),
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols)
        ]
    )

    # Base Regularized Estimator
    base_clf = LogisticRegression(
        C=2.0,
        class_weight="balanced",
        max_iter=1000,
        solver="lbfgs",
        random_state=42
    )

    # Calibrated Probability Classifier (5-Fold internal calibration)
    calibrated_clf = CalibratedClassifierCV(
        estimator=base_clf,
        cv=5
    )

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", calibrated_clf)
    ])

    # 1. 5-Fold Stratified Cross-Validation on the 80% Training Pool
    print("\n🔄 Running 5-Fold Stratified Cross-Validation...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_acc_scores = cross_val_score(pipeline, train_val_eng, train_val_eng["mealType"], cv=skf, scoring="accuracy")
    cv_f1_scores = cross_val_score(pipeline, train_val_eng, train_val_eng["mealType"], cv=skf, scoring="f1_weighted")

    # 2. Fit on Full Training Pool & Test on Holdout Test Set
    pipeline.fit(train_val_eng, train_val_eng["mealType"])

    y_train_pred = pipeline.predict(train_val_eng)
    y_test_pred = pipeline.predict(test_eng)

    y_train_true = train_val_eng["mealType"]
    y_test_true = test_eng["mealType"]

    train_acc = accuracy_score(y_train_true, y_train_pred) * 100
    test_acc = accuracy_score(y_test_true, y_test_pred) * 100
    test_balanced_acc = balanced_accuracy_score(y_test_true, y_test_pred) * 100
    test_prec = precision_score(y_test_true, y_test_pred, average="weighted") * 100
    test_rec = recall_score(y_test_true, y_test_pred, average="weighted") * 100
    test_f1 = f1_score(y_test_true, y_test_pred, average="weighted") * 100

    print("\n" + "=" * 80)
    print("🏆 FINAL PRODUCTION MODEL ACCURACY & PERFORMANCE METRICS")
    print("=" * 80)
    print(f"  🎯 Training Accuracy:           {train_acc:.2f}%")
    print(f"  🎯 5-Fold Cross-Val Accuracy:   {cv_acc_scores.mean()*100:.2f}% (+/- {cv_acc_scores.std()*100:.2f}%)")
    print(f"  🎯 5-Fold Cross-Val F1-Score:   {cv_f1_scores.mean()*100:.2f}%")
    print(f"  🎯 Holdout Test Accuracy (20%): {test_acc:.2f}%")
    print(f"  🎯 Balanced Test Accuracy:      {test_balanced_acc:.2f}%")
    print(f"  🎯 Weighted Test Precision:     {test_prec:.2f}%")
    print(f"  🎯 Weighted Test Recall:        {test_rec:.2f}%")
    print(f"  🎯 Weighted Test F1-Score:      {test_f1:.2f}%")
    print("=" * 80)

    # Detailed Per-Class Classification Report
    classes = sorted(list(set(y_train_true)))
    report_dict = classification_report(y_test_true, y_test_pred, target_names=classes, output_dict=True)

    print("\n📋 PER-CLASS CLASSIFICATION REPORT (HOLDOUT TEST DATASET):")
    print("-" * 80)
    print(f"{'Class / Meal Type':<20} | {'Precision':<12} | {'Recall':<12} | {'F1-Score':<12} | {'Support':<8}")
    print("-" * 80)
    for c in classes:
        p = report_dict[c]["precision"] * 100
        r = report_dict[c]["recall"] * 100
        f = report_dict[c]["f1-score"] * 100
        s = int(report_dict[c]["support"])
        print(f"{c.capitalize():<20} | {p:>10.2f}% | {r:>10.2f}% | {f:>10.2f}% | {s:>8}")
    print("-" * 80)
    print(f"{'Weighted Average':<20} | {test_prec:>10.2f}% | {test_rec:>10.2f}% | {test_f1:>10.2f}% | {len(y_test_true):>8}")
    print("-" * 80)

    # Confusion Matrix
    cm = confusion_matrix(y_test_true, y_test_pred, labels=classes)
    cm_df = pd.DataFrame(
        cm,
        index=[f"Actual {c.capitalize()}" for c in classes],
        columns=[f"Pred {c.capitalize()}" for c in classes]
    )

    print("\n🔲 CONFUSION MATRIX (TEST SET):")
    print("-" * 80)
    print(cm_df.to_string())
    print("-" * 80)

    # Normalized Confusion Matrix (% per class)
    cm_norm = confusion_matrix(y_test_true, y_test_pred, labels=classes, normalize="true") * 100
    cm_norm_df = pd.DataFrame(
        cm_norm,
        index=[f"Actual {c.capitalize()}" for c in classes],
        columns=[f"Pred {c.capitalize()}" for c in classes]
    )
    print("\n📊 CONFUSION MATRIX (ACCURACY % PER CLASS):")
    print("-" * 80)
    print(cm_norm_df.round(1).astype(str).add("%").to_string())
    print("-" * 80)

    # Generate and Save Visual Confusion Matrix Heatmap
    os.makedirs(visuals_dir, exist_ok=True)
    plt.figure(figsize=(9, 7))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=[c.capitalize() for c in classes],
        yticklabels=[c.capitalize() for c in classes],
        cbar=True, linewidths=1.5, linecolor="white",
        annot_kws={"size": 14, "weight": "bold"}
    )
    plt.title(f"Meal Mate Calibrated Confusion Matrix\n(Test Acc: {test_acc:.1f}%, 5-Fold CV: {cv_acc_scores.mean()*100:.1f}%)",
              fontsize=14, weight="bold", pad=15)
    plt.xlabel("Predicted Meal Type", fontsize=12, weight="bold")
    plt.ylabel("Actual Meal Type", fontsize=12, weight="bold")
    plt.tight_layout()

    cm_img_path = os.path.join(visuals_dir, "confusion_matrix.png")
    plt.savefig(cm_img_path, dpi=300)
    plt.close()
    print(f"\n✅ Saved High-Resolution Confusion Matrix Heatmap to: {cm_img_path}")

    # Serialize Best Model Artifact
    os.makedirs(model_dir, exist_ok=True)
    classifier_path = os.path.join(model_dir, "meal_mate_classifier.joblib")
    joblib.dump({
        "pipeline": pipeline,
        "classes": classes,
        "train_accuracy": train_acc,
        "cv_accuracy": cv_acc_scores.mean() * 100,
        "test_accuracy": test_acc,
        "test_precision": test_prec,
        "test_recall": test_rec,
        "test_f1": test_f1,
        "metrics_report": report_dict
    }, classifier_path, compress=3)
    print(f"✅ Saved Production Model Pipeline to: {classifier_path}")
    print("=" * 80)

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    model_dir = os.path.join(base_dir, "models")
    visuals_dir = os.path.join(base_dir, "visuals")
    train_production_model(data_dir, model_dir, visuals_dir)
