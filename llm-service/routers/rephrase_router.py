from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.llm_service import call_llm
from ..prompts.rephrase import REPHRASE_PROMPT

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str

@router.post("/chat/rephrase")
async def rephrase_text(request: AnalyzeRequest):
    user_text = request.text

    prompt = REPHRASE_PROMPT.format(user_text=user_text)

    try:
        llm_reply = await call_llm(
            prompt,
            max_tokens=1000,
            stop=["\n\n"],
            temperature=0.0,
        )
        
        print(f"LLM Rephrase Reply: {llm_reply}")
        return {"reply": llm_reply}

    except Exception as e:
        print(f"Error during LLM rephrasing: {e}")
        raise HTTPException(status_code=500, detail=f"LLMテキスト再構成中にエラーが発生しました: {e}")

