import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/visuals", tags=["Dataset & Analytics Visuals"])

def _get_image_response(filename: str):
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    img_path = os.path.join(base_dir, "visuals", filename)
    if not os.path.exists(img_path):
        raise HTTPException(
            status_code=404,
            detail=f"Visual '{filename}' not found. Run training/visualize.py or training/train_classifier.py."
        )
    return FileResponse(img_path, media_type="image/png")

@router.get("/confusion-matrix", summary="View Model Confusion Matrix Heatmap")
def get_confusion_matrix_chart():
    return _get_image_response("confusion_matrix.png")

@router.get("/feature-importance", summary="View Feature Importance Chart")
def get_feature_importance_chart():
    return _get_image_response("feature_importance.png")

@router.get("/split", summary="View 70/10/20 Train-Val-Test Partition Chart")
def get_split_chart():
    return _get_image_response("train_val_test_split.png")

@router.get("/nutrition", summary="View Calorie & Macro Distribution Chart")
def get_nutrition_chart():
    return _get_image_response("nutrition_distributions.png")

@router.get("/categories", summary="View Categorical Counts Chart")
def get_categories_chart():
    return _get_image_response("categorical_distributions.png")

@router.get("/macros", summary="View Protein vs Carbs Scatter Plot")
def get_macro_chart():
    return _get_image_response("macro_scatter.png")
