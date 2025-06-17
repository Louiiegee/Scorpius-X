# scorpius_scanner/core/telemetry.py
import logging
from opentelemetry import trace, metrics
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.asyncpg import AsyncPGInstrumentor
from .config import settings

logger = logging.getLogger(__name__)

def init_telemetry():
    """Initialize OpenTelemetry tracing and metrics"""
    if not settings.telemetry.enable_tracing:
        return

    # Create resource with service name
    resource = Resource.create({
        "service.name": settings.telemetry.otel_service_name,
        "service.version": "1.0.0"
    })

    # Initialize tracing
    if settings.telemetry.enable_tracing:
        trace_provider = TracerProvider(resource=resource)
        span_processor = BatchSpanProcessor(
            OTLPSpanExporter(
                endpoint=settings.telemetry.otel_endpoint,
                insecure=True
            )
        )
        trace_provider.add_span_processor(span_processor)
        trace.set_tracer_provider(trace_provider)
        logger.info("OpenTelemetry tracing initialized")

    # Initialize metrics
    if settings.telemetry.enable_metrics:
        metric_reader = PeriodicExportingMetricReader(
            OTLPMetricExporter(
                endpoint=settings.telemetry.otel_endpoint,
                insecure=True
            ),
            export_interval_millis=10000
        )
        metric_provider = MeterProvider(
            resource=resource,
            metric_readers=[metric_reader]
        )
        metrics.set_meter_provider(metric_provider)
        logger.info("OpenTelemetry metrics initialized")

def instrument_app(app):
    """Instrument FastAPI application"""
    FastAPIInstrumentor.instrument_app(app)
    # Instrument Redis correctly
    RedisInstrumentor().instrument()
    AsyncPGInstrumentor().instrument()
    logger.info("Application instrumentation complete")

# Global tracer and meter
tracer = trace.get_tracer(__name__)
# Use new metrics API
meter = metrics.get_meter_provider().get_meter(__name__)

# Custom metrics
scan_counter = meter.create_counter(
    "scorpius_scans_total",
    description="Total number of scans"
)

scan_duration = meter.create_histogram(
    "scorpius_scan_duration_seconds", 
    description="Scan duration in seconds"
)

plugin_counter = meter.create_counter(
    "scorpius_plugins_executed_total",
    description="Total plugins executed"
)
