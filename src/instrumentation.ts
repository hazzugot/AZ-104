/**
 * Next.js instrumentation hook. Initialises observability at server start.
 * Add Sentry / OpenTelemetry wiring here.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    // Lazy import so client bundles stay small.
    const { logger } = await import("./lib/logger");
    logger.info("instrumentation: server started");
  }
}
