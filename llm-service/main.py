from fastapi import FastAPI
from routers import feedback_router
from routers import chat_router
from routers import analyze_router
from routers import rephrase_router
from routers import deep_dive_router
from services.llm_service import load_llm_model
import logging
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter

# OpenTelemetry Tracingの設定
resource = Resource.create({"service.name": "llm-service"})
provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://otel-collector:4317")) # OTLP CollectorのgRPCエンドポイント
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

# OpenTelemetry Loggingの設定
log_provider = LoggerProvider(resource=resource)
log_exporter = OTLPLogExporter(endpoint="http://otel-collector:4317", insecure=True)
log_provider.add_log_record_processor(BatchLogRecordProcessor(log_exporter))
handler = LoggingHandler(level=logging.INFO, logger_provider=log_provider)
logging.getLogger().addHandler(handler)

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