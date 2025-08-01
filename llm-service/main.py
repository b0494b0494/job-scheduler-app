from fastapi import FastAPI
from .routers import feedback_router
from .routers import chat_router
from .routers import analyze_router
from .routers import rephrase_router
from .routers import deep_dive_router
from .services.llm_service import load_llm_model

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    await load_llm_model()

app.include_router(feedback_router.router)
app.include_router(chat_router.router)
app.include_router(analyze_router.router)
app.include_router(rephrase_router.router)
app.include_router(deep_dive_router.router)




