from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.llm_service import call_llm
from prompts.classify_feedback import CLASSIFY_FEEDBACK_PROMPT
import json
from opentelemetry import trace

router = APIRouter()

class TextClassificationRequest(BaseModel):
    text: str

class FeedbackClassificationResponse(BaseModel):
    impression: str = ""
    attraction: str = ""
    concern: str = ""
    aspiration: str = ""
    next_step: str = ""
    other: str = ""

@router.post("/classify-feedback")
async def classify_feedback(request: TextClassificationRequest):
    user_text = request.text

    # 現在のスパンを取得し、エンドポイントの入力を記録
    span = trace.get_current_span()
    span.set_attribute("input.value", user_text)

    prompt = CLASSIFY_FEEDBACK_PROMPT.format(user_text=user_text)

    try:
        generated_text = await call_llm(
            prompt,
            max_tokens=500,
            stop=["```"],
            temperature=0.1,
        )
        
        try:
            json_start = generated_text.find('{')
            json_end = generated_text.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                json_string = generated_text[json_start:json_end]
                classification_result = json.loads(json_string)
            else:
                raise ValueError("LLM output is not a valid JSON string.")
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}")
            print(f"Generated text: {generated_text}")
            raise HTTPException(status_code=500, detail="Failed to parse LLM output as JSON.")
        except ValueError as e:
            print(f"Value Error: {e}")
            print(f"Generated text: {generated_text}")
            raise HTTPException(status_code=500, detail="LLM output does not contain valid JSON.")

        response_data = FeedbackClassificationResponse(**classification_result)

        # エンドポイントの最終的な出力を記録
        span.set_attribute("output.value", response_data.model_dump_json())

        return response_data

    except Exception as e:
        print(f"Error during LLM classification: {e}")
        span.set_attribute("error", True)
        span.set_attribute("error.message", str(e))
        raise HTTPException(status_code=500, detail=f"LLM分類中にエラーが発生しました: {e}")