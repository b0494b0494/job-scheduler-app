from fastapi import APIRouter, HTTPException
from langgraph.graph import StateGraph
from pydantic import BaseModel
from typing import TypedDict, Annotated
import operator

from services.llm_service import call_llm
from prompts.rephrase import REPHRASE_PROMPT

class RephraseState(TypedDict):
    user_text: str
    llm_reply: str

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str

async def call_llm_node(state):
    user_text = state["user_text"]
    prompt = REPHRASE_PROMPT.format(user_text=user_text)
    llm_reply = await call_llm(
        prompt,
        max_tokens=1000,
        stop=["\n\n"],
        temperature=0.0,
    )
    return {"llm_reply": llm_reply}

@router.post("/chat/rephrase")
async def rephrase_text(request: AnalyzeRequest):
    user_text = request.text

    try:
        # Langgraphのグラフを構築
        workflow = StateGraph(RephraseState)

        # ノードを追加
        workflow.add_node("rephrase_llm", call_llm_node)

        # エントリポイントと終了ポイントを設定
        workflow.set_entry_point("rephrase_llm")
        workflow.set_finish_point("rephrase_llm")

        # グラフをコンパイル
        app = workflow.compile()

        # グラフを実行
        # LanggraphのStateは辞書形式で、ノード間で共有される
        result = await app.ainvoke({"user_text": user_text, "llm_reply": ""})

        llm_reply = result["llm_reply"]
        
        print(f"LLM Rephrase Reply: {llm_reply}")
        return {"reply": llm_reply}


    except Exception as e:
        print(f"Error during LLM rephrasing: {e}")
        raise HTTPException(status_code=500, detail=f"LLMテキスト再構成中にエラーが発生しました: {e}")