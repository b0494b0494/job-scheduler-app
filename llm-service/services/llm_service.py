import os
from fastapi import HTTPException
import httpx

LLM_SERVER_URL = os.getenv("LLM_SERVER_URL", "http://llama-server:8000") # LLMサーバーのURL

async def load_llm_model():
    # LLMサーバーのURLが設定されていることを確認する
    if not LLM_SERVER_URL:
        raise HTTPException(status_code=500, detail="LLM_SERVER_URL is not set.")
    print(f"LLM server URL set to: {LLM_SERVER_URL}")
    # サーバーが利用可能か簡単なヘルスチェックを行うことも可能だが、ここでは省略

async def call_llm(prompt: str, max_tokens: int, stop: list, temperature: float):
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
            return output["choices"][0]["text"].strip()
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"LLMサーバーへのリクエスト中にエラーが発生しました: {e}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"LLMサーバーからエラー応答: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM呼び出し中に予期せぬエラーが発生しました: {e}")