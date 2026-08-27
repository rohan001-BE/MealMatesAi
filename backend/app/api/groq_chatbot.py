from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.groq import ChatMessageRequest, ChatResponse
from app.services.groq_service import groq_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/chat", tags=["Groq AI Nutritionist Chatbot"])

@router.post("", response_model=ChatResponse, summary="Chat with AI Nutritionist (Groq Llama-3)")
async def chat_with_bot(
    req: ChatMessageRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Sends a nutrition, meal planning, or cuisine question to the Groq AI Nutritionist.
    Automatically maintains multi-turn conversation context in Firestore.
    """
    return await groq_service.ask_bot(
        message=req.message,
        user_id=current_user["id"],
        conversation_id=req.conversationId
    )

@router.get("/conversations", summary="Get User Chat Conversations List")
def get_conversations(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns list of all active chat conversation threads for the logged-in user.
    """
    convs = groq_service.get_user_conversations(current_user["id"])
    return {
        "success": True,
        "count": len(convs),
        "conversations": convs
    }

@router.get("/conversations/{conversation_id}", summary="Get Full Conversation Messages")
def get_conversation_by_id(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Fetches full message history of a specific conversation thread.
    """
    return {
        "success": True,
        "conversation": groq_service.get_conversation_by_id(conversation_id, current_user["id"])
    }

@router.delete("/conversations/{conversation_id}", summary="Delete Conversation Thread")
def delete_conversation(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Deletes a conversation thread from Firestore.
    """
    groq_service.delete_conversation(conversation_id, current_user["id"])
    return {
        "success": True,
        "message": "Conversation deleted successfully."
    }
