import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

describe("environment configuration", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it("should load valid environment configuration", async () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      PORT: "3000",
      NODE_ENV: "test",
    };

    const { env } = await import("./env.js");

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe("test");
    expect(env.DATABASE_URL).toBe(
      "postgresql://test:test@localhost:5432/test"
    );
  });

  it("should reject an invalid PORT", async () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      PORT: "abc",
      NODE_ENV: "test",
    };

    await expect(
      import("./env.js")
    ).rejects.toThrow(
      "PORT must be a valid number between 1 and 65535"
    );
  });

  it("should reject an invalid NODE_ENV", async () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      PORT: "3000",
      NODE_ENV: "invalid",
    };

    await expect(
      import("./env.js")
    ).rejects.toThrow(
      "NODE_ENV must be development, test, or production"
    );
  });

  it("should reject a missing DATABASE_URL", async () => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: "",
      PORT: "3000",
      NODE_ENV: "test",
    };

    await expect(
      import("./env.js")
    ).rejects.toThrow(
      "Missing required environment variable: DATABASE_URL"
    );
  });
});