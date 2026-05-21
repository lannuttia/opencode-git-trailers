import { describe, it, expect } from "vitest";
import { buildTrailers, formatTrailers } from "../src/trailers.js";

describe("trailers", () => {
  describe("formatTrailers", () => {
    it("should format trailers in git trailer format", () => {
      const trailers = {
        "model": "claude-sonnet-4-5",
        "co-authored-by": "AI Assistant <ai@opencode.ai>",
      };
      const formatted = formatTrailers(trailers);
      expect(formatted).toBe("Model: claude-sonnet-4-5\nCo-authored-by: AI Assistant <ai@opencode.ai>");
    });

    it("should return empty string for empty trailers", () => {
      expect(formatTrailers({})).toBe("");
    });
  });

  describe("buildTrailers", () => {
    it("should build trailers with interpolated variables", () => {
      const config = {
        "model": "{{model}}",
        "session": "{{session}}",
      };
      const variables = {
        "model": "claude-sonnet-4-5",
        "session": "abc123",
      };
      const result = buildTrailers(config, variables);
      expect(result).toEqual({
        "model": "claude-sonnet-4-5",
        "session": "abc123",
      });
    });
  });
});
