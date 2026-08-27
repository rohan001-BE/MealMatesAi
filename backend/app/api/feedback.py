from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, status
from app.schemas.feedback import FeedbackCreateRequest, FeedbackResponse
from app.services.feedback_service import feedback_service
from app.core.deps import get_optional_user

router = APIRouter(prefix="/api/feedback", tags=["Feedback & Contact Us"])

@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED, summary="Submit User Feedback & Contact Form")
@router.post("/submit", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED, summary="Submit Contact Us Message")
def submit_feedback(
    req: FeedbackCreateRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    """
    Submits user reviews or contact inquiries to Firestore.
    Supports both logged-in users and guest visitors.
    """
    user_id = current_user.get("id") if current_user else None
    if current_user:
        if not req.username:
            req.username = current_user.get("username", "Anonymous User")
        if not req.email:
            req.email = current_user.get("email", "")

    return feedback_service.submit_feedback(req, user_id=user_id)

@router.get("/all", summary="Get All User Feedbacks")
def get_all_feedbacks():
    """
    Fetches the 20 most recent user feedbacks, enriching them with username, email, and avatar.
    """
    feedbacks = feedback_service.get_all_feedbacks()
    return {
        "success": True,
        "feedbacks": feedbacks
    }
