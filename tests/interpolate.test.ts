import { describe, it, expect } from "vitest";
import { interpolateVariables } from "../src/interpolate.js";

describe("interpolateVariables", () => {
  it("should replace model variable", () => {
    const result = interpolateVariables("{{model}}", { model: "claude-sonnet-4-5" });
    expect(result).toBe("claude-sonnet-4-5");
  });
});
