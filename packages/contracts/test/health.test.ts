import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "../src/health.js";

describe("healthResponseSchema", () => {
  it("accepts both stable health responses", () => {
    expect(
      healthResponseSchema.parse({ status: "ok", database: "connected" }),
    ).toEqual({ status: "ok", database: "connected" });
    expect(
      healthResponseSchema.parse({ status: "error", database: "disconnected" }),
    ).toEqual({ status: "error", database: "disconnected" });
  });
});
