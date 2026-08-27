import os
import sys
import json
from google.cloud import firestore

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.firebase import db

def seed_firestore():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, "data", "cleaned_recipes.json")

    if not os.path.exists(json_path):
        print(f"❌ Cleaned recipes file not found at: {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        recipes = json.load(f)

    print("=" * 60)
    print(f"🔥 SEEDING {len(recipes)} RECIPES INTO FIREBASE FIRESTORE")
    print("=" * 60)

    recipes_ref = db.collection("recipes")
    batch = db.batch()
    batch_count = 0
    total_committed = 0

    for idx, recipe in enumerate(recipes):
        recipe_id = recipe.get("id") or f"rec_{idx+1:04d}"
        doc_ref = recipes_ref.document(recipe_id)
        batch.set(doc_ref, recipe)
        batch_count += 1

        if batch_count >= 400:
            batch.commit()
            total_committed += batch_count
            print(f"  • Committed {total_committed}/{len(recipes)} recipes to Firestore...")
            batch = db.batch()
            batch_count = 0

    if batch_count > 0:
        batch.commit()
        total_committed += batch_count
        print(f"  • Committed final batch: total {total_committed} recipes.")

    print(f"✅ Successfully seeded all {total_committed} recipes into Firestore!")
    print("=" * 60)

if __name__ == "__main__":
    seed_firestore()
