from fastapi import APIRouter, HTTPException, status
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation_service import recommendation_service

router = APIRouter(prefix="/api/recommendations", tags=["AI Meal Recommendations"])

@router.post(
    "",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Top-K AI Recipe Recommendations",
    description="""
    Recommends top matching recipes for a specific meal slot (breakfast, lunch, dinner, snack)
    using **K-Nearest Neighbors and Cosine Similarity**.

    - **Auto Nutrition Calculation**: If `dailyCalories` is omitted, user metrics (`gender`, `age`, `weight`, `height`, `activityLevel`, `weightGoal`) are used to automatically compute BMR & TDEE.
    - **Hard Safety Filters**: Strictly excludes any recipe containing ingredients matching items in `allergies` or `dislikes`.
    - **Dietary Alignment**: Tailors recipes for `keto`, `high_protein`, `low_carb`, `vegetarian`, `vegan`, or `balanced` diets.
    """
)
def get_recommendations(request: RecommendationRequest):
    try:
        return recommendation_service.get_recommendations(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation generation error: {str(e)}"
        )
