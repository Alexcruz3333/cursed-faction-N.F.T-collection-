import { NodeSDK } from "@opentelemetry/sdk-node";
import { env } from "./env.js";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

let sdk: NodeSDK | null = null;

export function setupTracing() {
  if (sdk) return sdk;

  try {
    // Only setup tracing if OTEL endpoint is configured
    if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      console.warn("OTEL_EXPORTER_OTLP_ENDPOINT not configured, skipping tracing setup");
      return null;
    }

    sdk = new NodeSDK({
      serviceName: env.SERVICE_NAME,
      traceExporter: new OTLPTraceExporter({ 
        url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
        headers: {}
      }),
      instrumentations: [getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Disable file system instrumentation to reduce noise
        },
      })]
    });

    sdk.start();
    console.log(`OpenTelemetry tracing started for service: ${env.SERVICE_NAME}`);

    const gracefulShutdown = async () => {
      try {
        await sdk?.shutdown();
        console.log('OpenTelemetry tracing shut down successfully');
      } catch (err) {
        console.error('Error shutting down OpenTelemetry:', err);
      }
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    return sdk;
  } catch (err) {
    console.error("Failed to setup OpenTelemetry tracing:", err);
    return null;
  }
}