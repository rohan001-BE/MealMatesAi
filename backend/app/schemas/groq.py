from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User question or prompt for the AI nutritionist")
    conversationId: Optional[str] = Field(None, description="Existing conversation ID to continue thread")

class ChatResponse(BaseModel):
    success: bool = True
    reply: str
    conversationId: str

class ConversationSummary(BaseModel):
    id: str
    title: str
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    messagesCount: int = 0
