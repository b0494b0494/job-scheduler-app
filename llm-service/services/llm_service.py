from llama_cpp import Llama
import os
from fastapi import HTTPException

llm = None

# モデルのパスを設定
script_dir = os.path.dirname(os.path.abspath(__file__))
# servicesディレクトリから一つ上の階層のmodelsディレクトリを参照
default_model_path = os.path.join(script_dir, "..", "models", "mistral-7b-instruct-v0.2.Q4_K_M.gguf")
MODEL_PATH = os.getenv("MODEL_PATH", default_model_path)

async def load_llm_model():
    global llm
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=500, detail=f"Model not found at {MODEL_PATH}")
    
    print(f"Loading model from {MODEL_PATH}...")
    llm = Llama(
        model_path=MODEL_PATH,
        n_gpu_layers=-1,
        n_ctx=2048,
        n_batch=512,
        verbose=True
    )
    print("Model loaded successfully.")

def get_llm_instance():
    if llm is None:
        raise HTTPException(status_code=503, detail="LLM model not loaded yet.")
    return llm

async def call_llm(prompt: str, max_tokens: int, stop: list, temperature: float):
    current_llm = get_llm_instance()
    try:
        output = current_llm(
            prompt,
            max_tokens=max_tokens,
            stop=stop,
            echo=False,
            temperature=temperature,
        )
        return output["choices"][0]["text"].strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM呼び出し中にエラーが発生しました: {e}")
