import datetime
from typing import Dict, Any, List, Optional
import httpx
from fastapi import HTTPException, status
from google.cloud.firestore import FieldFilter
from app.core.config import settings
from app.core.firebase import db
from app.schemas.groq import ChatResponse

SYSTEM_PROMPT = {
    "role": "system",
    "content": """You are Meal Mate AI, an expert nutritionist and dietary assistant specializing in Pakistani and international cuisine, meal planning, ingredient insights, and nutrition science.
You understand and respond in English, Urdu (اردو), and Roman Urdu fluently.
You provide detailed, friendly, and scientifically sound guidance on healthy recipes, macronutrients, ingredient substitutions, diet plans (Keto, High-Protein, Low-Carb, Balanced), and weight goals.
Keep answers concise, actionable, and encouraging. Focus strictly on food, health, diet, and nutrition topics."""
}

class GroqService:
    def __init__(self):
        self.conv_ref = db.collection("groq_conversations")
        self._http_client: Optional[httpx.AsyncClient] = None

    def _get_http_client(self) -> httpx.AsyncClient:
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(25.0, connect=5.0),
                limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
                http2=True
            )
        return self._http_client

    async def ask_bot(self, message: str, user_id: str, conversation_id: Optional[str] = None) -> ChatResponse:
        if not settings.GROQ_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GROQ_API_KEY is not configured in backend .env."
            )

        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        conv_doc = None
        messages_list = []

        if conversation_id:
            doc = self.conv_ref.document(conversation_id).get()
            if doc.exists:
                conv_data = doc.to_dict()
                if conv_data.get("userId") == user_id:
                    conv_doc = doc
                    messages_list = conv_data.get("messages", [])

        # Create new conversation document if none exists
        if not conv_doc:
            title = message[:45] + ("..." if len(message) > 45 else "")
            new_conv_data = {
                "userId": user_id,
                "title": title,
                "messages": [],
                "createdAt": now_str,
                "updatedAt": now_str
            }
            doc_ref = self.conv_ref.document()
            doc_ref.set(new_conv_data)
            conv_id = doc_ref.id
        else:
            conv_id = conv_doc.id

        # Append user message
        messages_list.append({
            "role": "user",
            "content": message,
            "timestamp": now_str
        })

        # Format for Groq OpenAI-compatible API
        groq_payload_messages = [SYSTEM_PROMPT]
        for m in messages_list[-8:]:  # Keep recent context window for fast latency
            role = "assistant" if m.get("role") in ["bot", "assistant"] else "user"
            groq_payload_messages.append({"role": role, "content": m.get("content", "")})

        client = self._get_http_client()
        try:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.GROQ_MODEL,
                    "messages": groq_payload_messages,
                    "temperature": 0.7,
                    "max_tokens": 800
                }
            )

            if response.status_code != 200:
                print(f"Groq API Error: {response.text}")
                bot_reply = "I'm having trouble connecting to my nutrition knowledge base right now. Please try again in a moment."
            else:
                data = response.json()
                bot_reply = data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"Exception calling Groq: {e}")
            bot_reply = "I couldn't process your question right now. Please check your internet connection or try again."

        # Append bot reply
        messages_list.append({
            "role": "assistant",
            "content": bot_reply,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        })

        # Update Firestore
        self.conv_ref.document(conv_id).update({
            "messages": messages_list,
            "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        })

        return ChatResponse(
            success=True,
            reply=bot_reply,
            conversationId=conv_id
        )

    def get_user_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        docs = self.conv_ref.where(filter=FieldFilter("userId", "==", user_id)).get()
        conversations = []
        for d in docs:
            data = d.to_dict()
            conversations.append({
                "id": d.id,
                "title": data.get("title", "Conversation"),
                "createdAt": data.get("createdAt"),
                "updatedAt": data.get("updatedAt"),
                "messages": data.get("messages", []),
                "messagesCount": len(data.get("messages", []))
            })
        conversations.sort(key=lambda x: x.get("updatedAt", ""), reverse=True)
        return conversations

    def get_conversation_by_id(self, conversation_id: str, user_id: str) -> Dict[str, Any]:
        doc = self.conv_ref.document(conversation_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        data = doc.to_dict()
        if data.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to conversation.")
        data["id"] = doc.id
        return data

    def delete_conversation(self, conversation_id: str, user_id: str):
        doc = self.conv_ref.document(conversation_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        if doc.to_dict().get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to conversation.")
        self.conv_ref.document(conversation_id).delete()

groq_service = GroqService()
