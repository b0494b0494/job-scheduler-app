from fastapi import FastAPI
from routers import feedback_router
from routers import chat_router
from routers import analyze_router
from routers import rephrase_router
from routers import deep_dive_router
from services.llm_service import load_llm_model

# OpenTelemetry関連のインポート
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

# OpenTelemetryの設定
resource = Resource.create({"service.name": "llm-service"})
provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://otel-collector:4317")) # OTLP CollectorのgRPCエンドポイント
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

app = FastAPI()

# FastAPIアプリケーションの計装
FastAPIInstrumentor.instrument_app(app)
# httpxクライアントの計装
HTTPXClientInstrumentor().instrument()

@app.on_event("startup")
async def startup_event():
    await load_llm_model()

app.include_router(feedback_router.router)
app.include_router(chat_router.router)
app.include_router(analyze_router.router)
app.include_router(rephrase_router.router)
app.include_router(deep_dive_router.router)