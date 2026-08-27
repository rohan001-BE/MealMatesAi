from typing import List, Dict, Any, Optional
import numpy as np
from app.ml.model_loader import model_loader

class KNNRecommender:
    def __init__(self):
        self.bundle = model_loader.bundle
        self.knn = self.bundle["knn_model"]
        self.pipeline = self.bundle["feature_pipeline"]
        self.recipes = self.bundle["recipes"]
        self.model_version = self.bundle.get("model_version", "meal-mate-v1")
        
        # Ensure feature matrix is loaded and pre-normalized
        self.raw_matrix = self.bundle.get("recipe_features")
        if self.raw_matrix is None:
            self.raw_matrix = self.bundle.get("recipe_features_matrix")
        if self.raw_matrix is None:
            self.raw_matrix = self.pipeline.transform(self.recipes)
            self.bundle["recipe_features"] = self.raw_matrix

        norms = np.linalg.norm(self.raw_matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1e-9
        self.normalized_matrix = self.raw_matrix / norms

    def filter_safe_candidates(self,
                               meal_type: Optional[str] = None,
                               dietary_type: Optional[str] = None,
                               allergies: Optional[List[str]] = None,
                               dislikes: Optional[List[str]] = None,
                               required_restrictions: Optional[List[str]] = None) -> List[tuple[int, Dict[str, Any]]]:
        """
        Returns list of (recipe_index, recipe_dict)
        """
        allergies = [a.strip().lower() for a in (allergies or []) if a]
        dislikes = [d.strip().lower() for d in (dislikes or []) if d]
        required_restrictions = [r.strip().lower() for r in (required_restrictions or []) if r]
        meal_type = meal_type.strip().lower() if meal_type else None
        dietary_type = dietary_type.strip().lower() if dietary_type else None

        safe = []
        for idx, r in enumerate(self.recipes):
            # 1. Meal Type match with flexible fallback
            if meal_type:
                norm_m = "snack" if ("snack" in meal_type or "tea" in meal_type) else meal_type
                r_meal = r.get("mealType", "").lower()
                if r_meal != norm_m and r_meal != meal_type:
                    # If slot is snack or tea, allow any recipe marked snack or with <= 350 calories
                    if norm_m == "snack" and (r.get("calories", 999) <= 350 or "snack" in r_meal or "breakfast" in r_meal):
                        pass
                    else:
                        continue

            # 2. Dietary Type match (if strict)
            if dietary_type and dietary_type != "balanced":
                r_diet = r.get("dietaryType", "").lower()
                if r_diet != dietary_type and dietary_type not in r_diet:
                    continue

            # 3. Fast Allergen & Dislike Check
            searchable = r.get("searchable_cache")
            if not searchable:
                ing_names = []
                for ing in r.get("ingredients", []):
                    if isinstance(ing, dict):
                        ing_names.append(ing.get("englishName", "").lower())
                        ing_names.append(ing.get("urduName", "").lower())
                    else:
                        ing_names.append(str(ing).lower())
                searchable = f"{r.get('recipeName', '').lower()} " + " ".join(ing_names)
                r["searchable_cache"] = searchable

            if allergies and any(allergy in searchable for allergy in allergies):
                continue

            if dislikes and any(dislike in searchable for dislike in dislikes):
                continue

            # 4. Required Restrictions Check
            if required_restrictions:
                r_restr = [restr.lower() for restr in r.get("restrictions", [])]
                if any(req not in r_restr for req in required_restrictions):
                    continue

            safe.append((idx, r))

        return safe

    def recommend(self,
                  target_calories: float,
                  target_protein: float,
                  target_carbs: float,
                  target_fat: float,
                  meal_type: str = "lunch",
                  dietary_type: str = "balanced",
                  weight_goal: str = "maintenance",
                  allergies: Optional[List[str]] = None,
                  dislikes: Optional[List[str]] = None,
                  restrictions: Optional[List[str]] = None,
                  top_k: int = 10) -> List[Dict[str, Any]]:
        
        safe_candidates = self.filter_safe_candidates(
            meal_type=meal_type,
            dietary_type=dietary_type,
            allergies=allergies,
            dislikes=dislikes,
            required_restrictions=restrictions
        )

        if not safe_candidates:
            return []

        user_vector = self.pipeline.transform_user_target(
            target_calories=target_calories,
            target_protein=target_protein,
            target_carbs=target_carbs,
            target_fat=target_fat,
            meal_type=meal_type,
            dietary_type=dietary_type,
            weight_goal=weight_goal,
            restrictions=restrictions or []
        )

        u_norm = np.linalg.norm(user_vector)
        u_norm = 1e-9 if u_norm == 0 else u_norm
        user_norm_vec = user_vector / u_norm

        indices = [item[0] for item in safe_candidates]
        sub_matrix = self.normalized_matrix[indices]

        # Vectorized Dot Product Similarity in NumPy
        similarities = np.dot(sub_matrix, user_norm_vec.T).flatten()

        # O(N) Top-K partition
        k = min(top_k, len(similarities))
        if k < len(similarities):
            top_partition = np.argpartition(-similarities, k)[:k]
            top_k_indices = top_partition[np.argsort(-similarities[top_partition])]
        else:
            top_k_indices = np.argsort(-similarities)

        results = []
        for i in top_k_indices:
            orig_idx, recipe = safe_candidates[i]
            r_copy = recipe.copy()
            score = float(similarities[i])
            normalized_score = round(max(min((score + 1.0) / 2.0, 1.0), 0.0), 4)
            r_copy["score"] = normalized_score
            results.append(r_copy)

        return results
