import sys
import pandas as pd

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


df = pd.read_csv("data/cleaned_recipes.csv")
keto_df = df[df["dietaryType"] == "keto"]

print("=" * 60)
print(f"🥑 TOTAL KETO RECIPES IN DATASET: {len(keto_df)}")
print("=" * 60)

print("\n📊 Keto Meal Type Breakdown:")
print(keto_df["mealType"].value_counts())

print("\n🥑 Keto Average Nutrition Profile:")
print(f"  • Average Calories: {keto_df['calories'].mean():.1f} kcal")
print(f"  • Average Fats:     {keto_df['fat'].mean():.1f} g (High Healthy Fat)")
print(f"  • Average Protein:  {keto_df['protein'].mean():.1f} g (Moderate Protein)")
print(f"  • Average Carbs:    {keto_df['carbs'].mean():.1f} g (Very Low Carb)")

print("\n🍽️ Sample Keto Recipes Across Slots:")
for mtype in ["breakfast", "lunch", "dinner", "snack"]:
    sample = keto_df[keto_df["mealType"] == mtype].head(2)
    print(f"\n--- {mtype.upper()} ---")
    for _, r in sample.iterrows():
        name = r["recipeName"]
        cals = r["calories"]
        fat = r["fat"]
        prot = r["protein"]
        carbs = r["carbs"]
        print(f"  • {name} | {cals} kcal | Fat: {fat}g | Protein: {prot}g | Carbs: {carbs}g")
