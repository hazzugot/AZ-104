import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "az104-platform" },
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true, singleLine: true } }
      : undefined,
  redact: {
    paths: ["password", "passwordHash", "*.password", "headers.authorization", "ANTHROPIC_API_KEY"],
    censor: "[REDACTED]",
  },
});
