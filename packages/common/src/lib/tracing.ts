import { NodeSDK } from "@opentelemetry/sdk-node";
import { env } from "./env.js";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

let sdk: NodeSDK | null = null;

export function setupTracing() {
  if (sdk) return sdk;
  sdk = new NodeSDK({
    serviceName: env.SERVICE_NAME,
    traceExporter: new OTLPTraceExporter({ url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces` }),
    instrumentations: [getNodeAutoInstrumentations()]
  });
  sdk.start();
  process.on("SIGTERM", async () => { await sdk?.shutdown(); });
  process.on("SIGINT", async () => { await sdk?.shutdown(); });
  return sdk;
}