import { beforeEach, describe, expect, it } from "vitest";
import { browserStorage } from "@/lib/storage";
describe("browserStorage", () => {
  beforeEach(() => localStorage.clear());
  it("round trips typed JSON", () => {
    browserStorage.set("setting", { enabled: true });
    expect(browserStorage.get<{ enabled: boolean }>("setting")).toEqual({
      enabled: true,
    });
  });
  it("returns null for malformed JSON", () => {
    localStorage.setItem("broken", "{");
    expect(() => browserStorage.get("broken")).not.toThrow();
    expect(browserStorage.get("broken")).toBeNull();
  });
});
