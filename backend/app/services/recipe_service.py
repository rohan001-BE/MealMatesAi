import re
from typing import Dict, Any, List, Optional
from collections import defaultdict
from fastapi import HTTPException, status
from google.cloud.firestore import FieldFilter
from app.core.firebase import db
from app.schemas.recipe import RecipeCreateRequest, RecipeListResponse
from app.ml.model_loader import model_loader

class FastRecipeIndex:
    """
    High-performance in-memory inverted index and category lookups for sub-millisecond queries.
    """
    def __init__(self, recipes: List[Dict[str, Any]]):
        self.recipes = recipes
        self.id_map: Dict[str, Dict[str, Any]] = {}
        self.meal_type_map: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.dietary_type_map: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.word_index: Dict[str, set] = defaultdict(set)
        
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        if not text:
            return []
        tokens = re.findall(r"\b[a-zA-Z0-9_\u0600-\u06FF]{2,}\b", text.lower())
        return tokens

    def _build_index(self):
        self.id_map.clear()
        self.meal_type_map.clear()
        self.dietary_type_map.clear()
        self.word_index.clear()

        for idx, r in enumerate(self.recipes):
            rec_id = r.get("id", f"rec_{idx}")
            self.id_map[rec_id] = r
            
            mt = r.get("mealType", "").lower()
            if mt: self.meal_type_map[mt].append(r)

            dt = r.get("dietaryType", "").lower()
            if dt: self.dietary_type_map[dt].append(r)

            # Index words across name, ingredients (English & Urdu), dietary type
            searchable_text = f"{r.get('recipeName', '')} {r.get('semantic_text', '')} {r.get('ingredients_str', '')}"
            for tok in self._tokenize(searchable_text):
                self.word_index[tok].add(rec_id)

class RecipeService:
    def __init__(self):
        self.recipes_ref = db.collection("recipes")
        self._index: Optional[FastRecipeIndex] = None

    def _get_index(self) -> FastRecipeIndex:
        recipes = model_loader.bundle.get("recipes", [])
        if self._index is None or len(self._index.recipes) != len(recipes):
            self._index = FastRecipeIndex(recipes)
        return self._index

    def get_all_recipes(self,
                        query: Optional[str] = None,
                        meal_type: Optional[str] = None,
                        dietary_type: Optional[str] = None,
                        min_calories: Optional[float] = None,
                        max_calories: Optional[float] = None,
                        page: int = 1,
                        limit: int = 20) -> RecipeListResponse:
        
        idx = self._get_index()
        
        # Fast candidate filtering
        candidate_ids = None
        if query:
            tokens = idx._tokenize(query)
            if tokens:
                matching_sets = [idx.word_index.get(tok, set()) for tok in tokens]
                # Union of matching sets or intersection
                matching_ids = set()
                for s in matching_sets:
                    matching_ids.update(s)
                candidate_ids = matching_ids
            else:
                candidate_ids = set(idx.id_map.keys())

        if candidate_ids is not None:
            pool = [idx.id_map[cid] for cid in candidate_ids if cid in idx.id_map]
        elif meal_type and meal_type.lower() in idx.meal_type_map:
            pool = idx.meal_type_map[meal_type.lower()]
        elif dietary_type and dietary_type.lower() in idx.dietary_type_map:
            pool = idx.dietary_type_map[dietary_type.lower()]
        else:
            pool = idx.recipes

        filtered = []
        mt_lower = meal_type.lower().strip() if meal_type else None
        dt_lower = dietary_type.lower().strip() if dietary_type else None

        for r in pool:
            if mt_lower and r.get("mealType", "").lower() != mt_lower:
                continue

            if dt_lower and r.get("dietaryType", "").lower() != dt_lower:
                continue

            cals = float(r.get("calories", 0))
            if min_calories is not None and cals < min_calories:
                continue
            if max_calories is not None and cals > max_calories:
                continue

            filtered.append(r)

        total = len(filtered)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated = filtered[start_idx:end_idx]

        total_pages = max(1, (total + limit - 1) // limit)

        return RecipeListResponse(
            success=True,
            count=len(paginated),
            total=total,
            page=page,
            totalPages=total_pages,
            recipes=paginated
        )

    def get_recipe_by_id(self, recipe_id: str) -> Dict[str, Any]:
        idx = self._get_index()
        if recipe_id in idx.id_map:
            return idx.id_map[recipe_id]

        doc = self.recipes_ref.document(recipe_id).get()
        if not doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recipe not found."
            )
        data = doc.to_dict()
        data["id"] = doc.id
        return data

    def create_recipe(self, req: RecipeCreateRequest) -> Dict[str, Any]:
        recipe_dict = req.model_dump()
        doc_ref = self.recipes_ref.document()
        doc_ref.set(recipe_dict)
        recipe_dict["id"] = doc_ref.id
        
        # Update in-memory pool
        recipes = model_loader.bundle.get("recipes", [])
        recipes.append(recipe_dict)
        self._index = FastRecipeIndex(recipes)
        return recipe_dict

    def delete_recipe(self, recipe_id: str):
        doc_ref = self.recipes_ref.document(recipe_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Recipe not found.")
        doc_ref.delete()
        
        recipes = model_loader.bundle.get("recipes", [])
        recipes = [r for r in recipes if r.get("id") != recipe_id]
        model_loader.bundle["recipes"] = recipes
        self._index = FastRecipeIndex(recipes)

recipe_service = RecipeService()
