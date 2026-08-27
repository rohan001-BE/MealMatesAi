from fastapi import APIRouter
from app.ml.model_loader import model_loader

router = APIRouter(tags=["Health & Diagnostics"])

@router.get("/health", summary="Health check endpoint")
def health_check():
    bundle = model_loader.bundle
    return {
        "status": "ok",
        "service": "meal-mate-ml",
        "modelVersion": bundle.get("model_version", "meal-mate-v1"),
        "totalRecipesIndexed": bundle.get("num_recipes", 0),
        "trainedAt": bundle.get("trained_at", "")
    }
