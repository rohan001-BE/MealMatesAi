import os
import sys
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def generate_visuals(data_dir: str, output_dir: str):
    print("=" * 60)
    print("📈 GENERATING DATASET & MODEL VISUALIZATIONS")
    print("=" * 60)

    os.makedirs(output_dir, exist_ok=True)
    cleaned_csv = os.path.join(data_dir, "cleaned_recipes.csv")
    train_csv = os.path.join(data_dir, "train_recipes.csv")
    val_csv = os.path.join(data_dir, "val_recipes.csv")
    test_csv = os.path.join(data_dir, "test_recipes.csv")

    if not os.path.exists(cleaned_csv):
        print(f"❌ Error: {cleaned_csv} not found.")
        return

    df = pd.read_csv(cleaned_csv)
    train_df = pd.read_csv(train_csv) if os.path.exists(train_csv) else pd.DataFrame()
    val_df = pd.read_csv(val_csv) if os.path.exists(val_csv) else pd.DataFrame()
    test_df = pd.read_csv(test_csv) if os.path.exists(test_csv) else pd.DataFrame()

    sns.set_theme(style="whitegrid")

    # 1. Train / Val / Test Split Pie Chart
    if not train_df.empty and not val_df.empty and not test_df.empty:
        plt.figure(figsize=(7, 7))
        splits = [len(train_df), len(val_df), len(test_df)]
        labels = [
            f"Train Set (70%)\n{len(train_df)} recipes",
            f"Validation Set (10%)\n{len(val_df)} recipes",
            f"Test Set (20%)\n{len(test_df)} recipes"
        ]
        colors = ["#3B82F6", "#F59E0B", "#10B981"]
        explode = (0.02, 0.05, 0.05)

        plt.pie(splits, labels=labels, autopct="%1.1f%%", startangle=140,
                colors=colors, explode=explode, textprops={"fontsize": 11, "weight": "bold"})
        plt.title("Meal Mate Dataset Partition (70% Train / 10% Val / 20% Test)", fontsize=14, weight="bold", pad=20)
        plt.tight_layout()
        split_img_path = os.path.join(output_dir, "train_val_test_split.png")
        plt.savefig(split_img_path, dpi=300)
        plt.close()
        print(f"✅ Saved split visualization: {split_img_path}")

    # 2. Nutrition Distribution Grid (Calories, Protein, Carbs, Fat)
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle("Meal Mate Macronutrient & Calorie Distributions", fontsize=16, weight="bold")

    sns.histplot(df["calories"], kde=True, ax=axes[0, 0], color="#EF4444", bins=25)
    axes[0, 0].set_title("Calorie Distribution (kcal)", weight="bold")
    axes[0, 0].set_xlabel("Calories")

    sns.histplot(df["protein"], kde=True, ax=axes[0, 1], color="#3B82F6", bins=25)
    axes[0, 1].set_title("Protein Distribution (g)", weight="bold")
    axes[0, 1].set_xlabel("Protein (g)")

    sns.histplot(df["carbs"], kde=True, ax=axes[1, 0], color="#10B981", bins=25)
    axes[1, 0].set_title("Carbohydrates Distribution (g)", weight="bold")
    axes[1, 0].set_xlabel("Carbs (g)")

    sns.histplot(df["fat"], kde=True, ax=axes[1, 1], color="#F59E0B", bins=25)
    axes[1, 1].set_title("Fats Distribution (g)", weight="bold")
    axes[1, 1].set_xlabel("Fat (g)")

    plt.tight_layout()
    dist_img_path = os.path.join(output_dir, "nutrition_distributions.png")
    plt.savefig(dist_img_path, dpi=300)
    plt.close()
    print(f"✅ Saved nutrition distribution chart: {dist_img_path}")

    # 3. Categorical Distributions (Meal Types & Dietary Types)
    fig, axes = plt.subplots(1, 2, figsize=(15, 6))
    fig.suptitle("Meal Types & Dietary Categorization", fontsize=16, weight="bold")

    meal_counts = df["mealType"].value_counts()
    sns.barplot(x=meal_counts.index, y=meal_counts.values, ax=axes[0], palette="viridis")
    axes[0].set_title("Meal Type Counts", weight="bold")
    axes[0].set_ylabel("Number of Recipes")
    axes[0].tick_params(axis="x", rotation=30)

    diet_counts = df["dietaryType"].value_counts()
    sns.barplot(x=diet_counts.index, y=diet_counts.values, ax=axes[1], palette="magma")
    axes[1].set_title("Dietary Type Counts", weight="bold")
    axes[1].set_ylabel("Number of Recipes")
    axes[1].tick_params(axis="x", rotation=30)

    plt.tight_layout()
    cat_img_path = os.path.join(output_dir, "categorical_distributions.png")
    plt.savefig(cat_img_path, dpi=300)
    plt.close()
    print(f"✅ Saved category distribution chart: {cat_img_path}")

    # 4. Macro Scatter by Dietary Type
    plt.figure(figsize=(10, 6))
    sns.scatterplot(
        data=df, x="carbs", y="protein", size="calories", hue="dietaryType",
        sizes=(30, 250), alpha=0.7, palette="tab10"
    )
    plt.title("Macronutrient Mapping (Protein vs Carbs by Diet Type)", fontsize=14, weight="bold")
    plt.xlabel("Carbohydrates (g)", weight="bold")
    plt.ylabel("Protein (g)", weight="bold")
    plt.legend(bbox_to_anchor=(1.05, 1), loc="upper left")
    plt.tight_layout()
    macro_img_path = os.path.join(output_dir, "macro_scatter.png")
    plt.savefig(macro_img_path, dpi=300)
    plt.close()
    print(f"✅ Saved macro scatter plot: {macro_img_path}")

    print("=" * 60)

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    output_dir = os.path.join(base_dir, "visuals")
    generate_visuals(data_dir, output_dir)
