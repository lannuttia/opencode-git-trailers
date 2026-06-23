import { describe, it, expect } from "vitest";
import { buildTrailers, formatTrailers } from "../src/trailers.js";

describe("trailers", () => {
  describe("formatTrailers", () => {
    it("should format trailers in git trailer format without capitalization", () => {
      const trailers = {
        "model": "claude-sonnet-4-5",
        "co-authored-by": "AI Assistant <ai@opencode.ai>",
      };
      const formatted = formatTrailers(trailers);
      expect(formatted).toBe("model: claude-sonnet-4-5\nco-authored-by: AI Assistant <ai@opencode.ai>");
    });

    it("should return empty string for empty trailers", () => {
      expect(formatTrailers({})).toBe("");
    });

    it("should preserve trailer key casing exactly as provided", () => {
      const trailers = {
        "session": "abc123",
        "timestamp": "2024-01-01T00:00:00Z",
      };
      const formatted = formatTrailers(trailers);
      expect(formatted).toBe("session: abc123\ntimestamp: 2024-01-01T00:00:00Z");
    });

    it("should preserve capitalized trailer keys as-is", () => {
      const trailers = {
        "Model": "claude-sonnet-4-5",
      };
      const formatted = formatTrailers(trailers);
      expect(formatted).toBe("Model: claude-sonnet-4-5");
    });

    it("should preserve hyphenated keys without modification", () => {
      const trailers = {
        "co-authored-by": "Test User",
        "signed-off-by": "Another User",
      };
      const formatted = formatTrailers(trailers);
      expect(formatted).toBe("co-authored-by: Test User\nsigned-off-by: Another User");
    });

    it("should handle special characters in values", () => {
      const trailers = {
        "message": "Value with: colons, commas, and\nnewlines",
      };
      const formatted = formatTrailers(trailers);
      expect(formatted).toBe("message: Value with: colons, commas, and\nnewlines");
    });

    it("should handle single trailer", () => {
      const trailers = {
        "model": "test-model",
      };
      const formatted = formatTrailers(trailers);
      expect(formatted).toBe("model: test-model");
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

    it("should filter out trailers with empty values", () => {
      const config = {
        "model": "{{model}}",
        "session": "{{session}}",
        "provider": "{{provider}}",
      };
      const variables = {
        "model": "claude-sonnet-4-5",
        "session": "",
        "provider": "   ",
      };
      const result = buildTrailers(config, variables);
      expect(result).toEqual({
        "model": "claude-sonnet-4-5",
      });
    });

    it("should filter out trailers with undefined variables", () => {
      const config = {
        "model": "{{model}}",
        "missing": "{{undefined_var}}",
      };
      const variables = {
        "model": "claude-sonnet-4-5",
      };
      const result = buildTrailers(config, variables);
      expect(result).toEqual({
        "model": "claude-sonnet-4-5",
      });
    });

    it("should handle static trailer values (no variables)", () => {
      const config = {
        "coding-agent": "OpenCode",
        "model": "{{model}}",
      };
      const variables = {
        "model": "claude-sonnet-4-5",
      };
      const result = buildTrailers(config, variables);
      expect(result).toEqual({
        "coding-agent": "OpenCode",
        "model": "claude-sonnet-4-5",
      });
    });

    it("should handle mixed static and variable content", () => {
      const config = {
        "info": "Model: {{model}}, Provider: {{provider}}",
      };
      const variables = {
        "model": "claude-sonnet-4-5",
        "provider": "anthropic",
      };
      const result = buildTrailers(config, variables);
      expect(result).toEqual({
        "info": "Model: claude-sonnet-4-5, Provider: anthropic",
      });
    });

    it("should handle empty config", () => {
      const result = buildTrailers({}, { model: "test" });
      expect(result).toEqual({});
    });

    it("should handle empty variables", () => {
      const config = {
        "static": "value",
        "dynamic": "{{missing}}",
      };
      const result = buildTrailers(config, {});
      expect(result).toEqual({
        "static": "value",
      });
    });

    it("should preserve whitespace in non-empty values", () => {
      const config = {
        "message": "{{msg}}",
      };
      const variables = {
        "msg": "  padded  ",
      };
      const result = buildTrailers(config, variables);
      expect(result).toEqual({
        "message": "  padded  ",
      });
    });
  });
});
