import traceback
from opentelemetry import trace # OpenTelemetryのインポート
from fastapi import APIRouter, HTTPException
from langgraph.graph import StateGraph, END
from pydantic import BaseModel
from typing import TypedDict, Annotated
import operator

from services.llm_service import call_llm
from prompts.rephrase import REPHRASE_PROMPT
from prompts.refine_rephrase import REFINE_REPHRASE_PROMPT

# LangGraphの状態定義
class RephraseState(TypedDict):
    user_text: str
    llm_reply: str
    final_reply: str

# LangGraphノード: 初期リフレーズ
async def initial_rephrase_node(state: RephraseState) -> RephraseState:
    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("langgraph.node.initial_rephrase") as span:
        user_text = state["user_text"]
        prompt = REPHRASE_PROMPT.format(user_text=user_text)
        llm_reply = await call_llm(
            prompt,
            max_tokens=1000,
            stop=["\n\n"],
            temperature=0.0,
        )
        span.set_attribute("output.value", llm_reply)
        return {"llm_reply": llm_reply}

# LangGraphノード: リファインリフレーズ
async def refine_rephrase_node(state: RephraseState) -> RephraseState:
    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("langgraph.node.refine_rephrase") as span:
        llm_reply = state["llm_reply"]
        prompt = REFINE_REPHRASE_PROMPT.format(input_text=llm_reply)
        refined_reply = await call_llm(
            prompt,
            max_tokens=1000, # Adjust as needed
            stop=["\n\n"],
            temperature=0.0,
        )
        span.set_attribute("output.value", refined_reply)
        return {"final_reply": refined_reply}

# LangGraphワークフローの構築
workflow = StateGraph(RephraseState)
workflow.add_node("initial_rephrase", initial_rephrase_node)
workflow.add_node("refine_rephrase", refine_rephrase_node)

workflow.set_entry_point("initial_rephrase")
workflow.add_edge("initial_rephrase", "refine_rephrase")
workflow.set_finish_point("refine_rephrase")

app_workflow = workflow.compile() # FastAPIのappと名前が衝突しないように変更

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str

@router.post("/chat/rephrase")
async def rephrase_text(request: AnalyzeRequest):
    user_text = request.text

    try:
        # Langgraphワークフローを実行
        result = await app_workflow.ainvoke({"user_text": user_text, "llm_reply": "", "final_reply": ""})

        final_reply = result["final_reply"]
        
        
        return {"reply": final_reply}

    except Exception as e:
        traceback.print_exc()
        print(f"Error during LLM rephrasing: {e}")
        raise HTTPException(status_code=500, detail=f"LLMテキスト再構成中にエラーが発生しました: {e}")