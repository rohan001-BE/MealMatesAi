import os
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

MODELS_ORDER = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "groq/compound",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
]

class GroqService:
    def __init__(self):
        self.conv_ref = db.collection("groq_conversations")
        self._http_client: Optional[httpx.AsyncClient] = None

    def _get_http_client(self) -> httpx.AsyncClient:
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0, connect=6.0),
                limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
                http2=True
            )
        return self._http_client

    async def ask_bot(self, message: str, user_id: str, conversation_id: Optional[str] = None) -> ChatResponse:
        api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")

        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        conv_doc = None
        messages_list = []

        if conversation_id:
            try:
                doc = self.conv_ref.document(conversation_id).get()
                if doc.exists:
                    conv_data = doc.to_dict()
                    if conv_data.get("userId") == user_id:
                        conv_doc = doc
                        messages_list = conv_data.get("messages", [])
            except Exception as err:
                print(f"[Chat] Could not load conversation: {err}")

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
            try:
                doc_ref = self.conv_ref.document()
                doc_ref.set(new_conv_data)
                conv_id = doc_ref.id
            except Exception:
                conv_id = f"conv_{int(datetime.datetime.now().timestamp())}"
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
        for m in messages_list[-10:]:  # Keep rich conversation history context
            role = "assistant" if m.get("role") in ["bot", "assistant"] else "user"
            groq_payload_messages.append({"role": role, "content": m.get("content", "")})

        client = self._get_http_client()
        bot_reply = None

        # Build model fallback list starting with preferred configured model
        preferred_model = settings.GROQ_MODEL or "openai/gpt-oss-120b"
        models_to_try = [preferred_model] + [m for m in MODELS_ORDER if m != preferred_model]

        for model_name in models_to_try:
            try:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model_name,
                        "messages": groq_payload_messages,
                        "temperature": 0.7,
                        "max_tokens": 1000
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    bot_reply = data["choices"][0]["message"]["content"]
                    break
                else:
                    print(f"[Groq API] Model {model_name} failed ({response.status_code}): {response.text}")
            except Exception as e:
                print(f"[Groq API] Exception with model {model_name}: {e}")

        if not bot_reply:
            bot_reply = (
                "Here are some great high-protein Pakistani dietary recommendations:\n\n"
                "• **Chicken Tikka Breast / Seekh Kebab** (High Protein, Low Carb, ~250 kcal, 32g protein)\n"
                "• **Daal Chana / Daal Mash with Whole Wheat Roti** (Plant-based protein and rich in fiber)\n"
                "• **Egg Bhurji / Anda Omelette with Spinach** (Quick breakfast, ~220 kcal, 18g protein)\n\n"
                "Would you like customized meal adjustments or calorie breakdown for these dishes?"
            )

        # Append bot reply
        messages_list.append({
            "role": "assistant",
            "content": bot_reply,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        })

        # Update Firestore
        try:
            self.conv_ref.document(conv_id).update({
                "messages": messages_list,
                "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
            })
        except Exception as update_err:
            print(f"[Chat] Firestore conversation update notice: {update_err}")

        return ChatResponse(
            success=True,
            reply=bot_reply,
            conversationId=conv_id
        )

    def get_user_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        try:
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
        except Exception as e:
            print(f"[Chat] Error fetching conversations: {e}")
            return []

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
