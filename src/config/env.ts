import "dotenv/config";

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
};

const port = Number(
  process.env.PORT ?? 5000
);

if (
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65535
) {
  throw new Error(
    "PORT must be a valid number between 1 and 65535"
  );
}

const nodeEnv =
  process.env.NODE_ENV ?? "development";

if (
  ![
    "development",
    "test",
    "production",
  ].includes(nodeEnv)
) {
  throw new Error(
    "NODE_ENV must be development, test, or production"
  );
}

const configuredCorsOrigin =
  process.env.CORS_ORIGIN;

if (
  nodeEnv === "production" &&
  !configuredCorsOrigin
) {
  throw new Error(
    "CORS_ORIGIN must be explicitly configured in production"
  );
}

const corsOrigin =
  configuredCorsOrigin ??
  "http://localhost:8000";

let corsUrl: URL;

try {
  corsUrl = new URL(corsOrigin);
} catch {
  throw new Error(
    "CORS_ORIGIN must be a valid URL"
  );
}

if (
  nodeEnv === "production" &&
  (
    corsUrl.hostname === "localhost" ||
    corsUrl.hostname === "127.0.0.1" ||
    corsUrl.hostname === "::1"
  )
) {
  throw new Error(
    "CORS_ORIGIN cannot point to localhost in production"
  );
}

export const env = {
  NODE_ENV: nodeEnv,
  PORT: port,
  DATABASE_URL: requiredEnv("DATABASE_URL"),
  REDIS_URL: requiredEnv("REDIS_URL"),
  CORS_ORIGIN: corsOrigin,
};