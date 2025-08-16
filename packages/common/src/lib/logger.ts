import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  name: env.SERVICE_NAME,
  level: process.env.LOG_LEVEL ?? (env.NODE_ENV === "production" ? "info" : "debug"),
  transport: env.NODE_ENV === "production" ? undefined : {
    target: "pino-pretty",
    options: { colorize: true, translateTime: "SYS:standard" }
  }
});