from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.llm_service import call_llm
from prompts.chat import CHAT_SYSTEM_PROMPT

router = APIRouter()

class ChatMessage(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]

@router.post("/chat")
async def chat(request: ChatRequest):
    system_prompt = CHAT_SYSTEM_PROMPT
    
    conversation_history = ""
    for msg in request.messages:
        if msg.sender == 'user':
            conversation_history += f"ユーザー: {msg.text}\n"
        else:
            conversation_history += f"アシスタント: {msg.text}\n"

    prompt = f"{system_prompt}{conversation_history}アシスタント:"

    try:
        llm_reply = await call_llm(
            prompt,
            max_tokens=500,
            stop=["ユーザー:", "アシスタント:", "\n\n"],
            temperature=0.7,
        )
        print(f"LLM Reply: {llm_reply}")
        return {"reply": llm_reply}

    except Exception as e:
        print(f"Error during LLM chat: {e}")
        raise HTTPException(status_code=500, detail=f"LLMチャット中にエラーが発生しました: {e}")