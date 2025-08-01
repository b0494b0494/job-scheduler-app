from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.llm_service import call_llm
from ..prompts.analyze_chat import ANALYZE_CHAT_PROMPT

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str

@router.post("/chat/analyze")
async def analyze_chat(request: AnalyzeRequest):
    user_text = request.text

    prompt = ANALYZE_CHAT_PROMPT.format(user_text=user_text)

    try:
        llm_reply = await call_llm(
            prompt,
            max_tokens=300,
            stop=["\n\n"],
            temperature=0.7,
        )
        print(f"LLM Analyze Reply: {llm_reply}")
        return {"reply": llm_reply}

    except Exception as e:
        print(f"Error during LLM analysis: {e}")
        raise HTTPException(status_code=500, detail=f"LLM分析中にエラーが発生しました: {e}")
