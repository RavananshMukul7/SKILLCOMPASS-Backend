import { afterAll, beforeAll, describe, expect, it } from "vitest";

import http from "node:http";

import app from "./app.js";

describe("Express application integration", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = http.createServer(app);

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const address = server.address();

        if (typeof address === "object" && address !== null) {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }

        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it("should return 200 from the health endpoint", async () => {
    const response = await fetch(`${baseUrl}/api/health`);

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.success).toBe(true);

    expect(body.data).toMatchObject({
      status: "ok",
      service: "SkillCompass API",
      database: "connected",
    });

    expect(body.data.timestamp).toEqual(expect.any(String));
  });

  it("should return 404 for an unknown API route", async () => {
    const response = await fetch(`${baseUrl}/api/does-not-exist`);

    expect(response.status).toBe(404);

    const body = await response.json();

    expect(body).toMatchObject({
      success: false,
    });
  });

  it("should return JSON for an unknown API route", async () => {
    const response = await fetch(`${baseUrl}/api/unknown-route`);

    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should include security headers", async () => {
    const response = await fetch(`${baseUrl}/api/health`);

    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("should reject oversized JSON requests", async () => {
    const largePayload = JSON.stringify({
      data: "x".repeat(1024 * 1024 + 100),
    });

    const response = await fetch(`${baseUrl}/api/health`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: largePayload,
    });

    expect(response.status).toBe(413);

    const body = await response.json();

    expect(body).toMatchObject({
      success: false,
      message: "Request body is too large",
    });
  });
});
