import os
from fastapi import HTTPException
import httpx
from opentelemetry import trace # OpenTelemetryのインポート

LLM_SERVER_URL = os.getenv("LLM_SERVER_URL", "http://llama-server:8000") # LLMサーバーのURL

async def load_llm_model():
    # LLMサーバーのURLが設定されていることを確認する
    if not LLM_SERVER_URL:
        raise HTTPException(status_code=500, detail="LLM_SERVER_URL is not set.")
    print(f"LLM server URL set to: {LLM_SERVER_URL}")
    # サーバーが利用可能か簡単なヘルスチェックを行うことも可能だが、ここでは省略

async def call_llm(prompt: str, max_tokens: int, stop: list, temperature: float):
    tracer = trace.get_tracer(__name__) # トレーサーを取得
    with tracer.start_as_current_span("call_llm_server") as span: # 新しいスパンを開始
        span.set_attribute("llm.prompt", prompt) # プロンプトを属性として記録
        span.set_attribute("llm.max_tokens", max_tokens)
        span.set_attribute("llm.temperature", temperature)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{LLM_SERVER_URL}/v1/completions",
                    json={
                        "prompt": prompt,
                        "max_tokens": max_tokens,
                        "stop": stop,
                        "temperature": temperature,
                        "echo": False,
                    },
                    timeout=60.0 # タイムアウトを設定
                )
                response.raise_for_status() # HTTPエラーが発生した場合に例外を発生させる
                output = response.json()
                
                # LLMからの応答を属性として記録
                span.set_attribute("llm.response", output["choices"][0]["text"].strip())

                return output["choices"][0]["text"].strip()
        except httpx.RequestError as e:
            span.set_attribute("error", True) # エラー発生時にエラー属性を設定
            span.set_attribute("error.message", str(e))
            raise HTTPException(status_code=500, detail=f"LLMサーバーへのリクエスト中にエラーが発生しました: {e}")
        except httpx.HTTPStatusError as e:
            span.set_attribute("error", True)
            span.set_attribute("error.message", e.response.text)
            raise HTTPException(status_code=e.response.status_code, detail=f"LLMサーバーからエラー応答: {e.response.text}")
        except Exception as e:
            span.set_attribute("error", True)
            span.set_attribute("error.message", str(e))
            raise HTTPException(status_code=500, detail=f"LLM呼び出し中に予期せぬエラーが発生しました: {e}")