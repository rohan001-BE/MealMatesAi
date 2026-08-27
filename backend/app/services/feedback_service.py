import datetime
from typing import Dict, Any, List, Optional
from app.core.firebase import db
from app.schemas.feedback import FeedbackCreateRequest, FeedbackResponse

class FeedbackService:
    def __init__(self):
        self.fb_ref = db.collection("feedbacks")
        self.contact_ref = db.collection("contact_submissions")

    def submit_feedback(self, req: FeedbackCreateRequest, user_id: Optional[str] = None) -> FeedbackResponse:
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        msg = (req.message or req.feedback or "").strip()
        
        feedback_data = {
            "userId": user_id or "anonymous",
            "username": req.username or "Anonymous User",
            "email": req.email or "",
            "message": msg,
            "rating": req.rating or 5,
            "category": req.category or "contact",
            "createdAt": now_str
        }
        
        doc_ref = self.fb_ref.document()
        doc_ref.set(feedback_data)

        # Also save to contact_submissions for admin logs
        try:
            self.contact_ref.document(doc_ref.id).set(feedback_data)
        except Exception:
            pass

        return FeedbackResponse(
            success=True,
            message="Thank you! Your message has been received and saved.",
            feedbackId=doc_ref.id
        )

    def get_all_feedbacks(self) -> List[Dict[str, Any]]:
        docs = self.fb_ref.order_by("createdAt", direction="DESCENDING").limit(20).get()
        feedbacks = []
        for d in docs:
            data = d.to_dict()
            user_id = data.get("userId")
            username = data.get("username") or "Anonymous"
            email = data.get("email") or ""
            profile_image = "/assets/default-profile.png"
            
            if user_id and user_id != "anonymous":
                try:
                    u_doc = db.collection("users").document(user_id).get()
                    if u_doc.exists:
                        u_data = u_doc.to_dict()
                        if not username or username == "Anonymous":
                            username = u_data.get("username", "Anonymous")
                        email = email or u_data.get("email", "")
                        profile_image = u_data.get("profileImage", "/assets/default-profile.png")
                except Exception:
                    pass
            feedbacks.append({
                "username": username,
                "email": email,
                "message": data.get("message", ""),
                "profileImage": profile_image,
                "rating": data.get("rating", 5),
                "submittedAt": data.get("createdAt")
            })
        return feedbacks

feedback_service = FeedbackService()
