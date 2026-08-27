from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class FeedbackCreateRequest(BaseModel):
    username: Optional[str] = Field(None, description="Sender username or full name")
    email: Optional[str] = Field(None, description="Sender email address")
    message: Optional[str] = Field(None, description="User feedback message or inquiry")
    feedback: Optional[str] = Field(None, description="Alias for message")
    rating: Optional[int] = Field(5, ge=1, le=5, description="Star rating (1 to 5)")
    category: Optional[str] = Field("contact", description="'contact', 'meal_plan', 'recipes', 'ui', 'general'")

class FeedbackResponse(BaseModel):
    success: bool = True
    message: str = "Thank you! Your message has been saved successfully."
    feedbackId: str
