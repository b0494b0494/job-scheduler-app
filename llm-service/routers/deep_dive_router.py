from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.llm_service import call_llm
from ..prompts.deep_dive_questions import DEEP_DIVE_QUESTIONS_PROMPT

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str

@router.post("/chat/deep_dive_questions")
async def deep_dive_questions(request: AnalyzeRequest):
    user_text = request.text

    prompt = DEEP_DIVE_QUESTIONS_PROMPT.format(user_text=user_text)

    try:
        llm_reply = await call_llm(
            prompt,
            max_tokens=300,
            stop=["\n\n"],
            temperature=0.7,
        )
        
        print(f"LLM Deep Dive Questions Reply: {llm_reply}")
        return {"reply": llm_reply}

    except Exception as e:
        print(f"Error during LLM deep dive questions: {e}")
        raise HTTPException(status_code=500, detail=f"LLM深掘り質問生成中にエラーが発生しました: {e}")
