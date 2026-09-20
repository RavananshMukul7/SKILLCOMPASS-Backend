import "dotenv/config";
const requiredEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};
const port = Number(process.env.PORT ?? 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid number between 1 and 65535");
}
const nodeEnv = process.env.NODE_ENV ?? "development";
if (!["development", "test", "production"].includes(nodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production");
}
export const env = {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: requiredEnv("DATABASE_URL"),
    CORS_ORIGIN: requiredEnv("CORS_ORIGIN"),
};
