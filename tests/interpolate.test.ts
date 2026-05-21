import { describe, it, expect } from "vitest";
import { interpolateVariables } from "../src/interpolate.js";

describe("interpolateVariables", () => {
  it("should replace single variable", () => {
    const result = interpolateVariables("{{model}}", { model: "claude-sonnet-4-5" });
    expect(result).toBe("claude-sonnet-4-5");
  });

  it("should replace multiple variables in one template", () => {
    const result = interpolateVariables(
      "Model: {{model}}, Session: {{session}}, Provider: {{provider}}",
      {
        model: "claude-sonnet-4-5",
        session: "abc123",
        provider: "anthropic",
      }
    );
    expect(result).toBe("Model: claude-sonnet-4-5, Session: abc123, Provider: anthropic");
  });

  it("should handle nested/dotted variable paths", () => {
    const result = interpolateVariables("{{user.name}} <{{user.email}}>", {
      "user.name": "John Doe",
      "user.email": "john@example.com",
    });
    expect(result).toBe("John Doe <john@example.com>");
  });

  it("should leave undefined variables as placeholders", () => {
    const result = interpolateVariables("{{model}} {{undefined}}", {
      model: "claude-sonnet-4-5",
    });
    expect(result).toBe("claude-sonnet-4-5 {{undefined}}");
  });

  it("should handle empty string values", () => {
    const result = interpolateVariables("Value: {{empty}}", { empty: "" });
    expect(result).toBe("Value: ");
  });

  it("should handle malformed placeholders by leaving them unchanged", () => {
    const result = interpolateVariables("{{incomplete {{model}} {notvalid}", {
      model: "claude-sonnet-4-5",
    });
    expect(result).toBe("{{incomplete claude-sonnet-4-5 {notvalid}");
  });

  it("should handle empty placeholder {{}} by leaving it unchanged", () => {
    const result = interpolateVariables("Empty: {{}}", {});
    expect(result).toBe("Empty: {{}}");
  });

  it("should handle template with no variables", () => {
    const result = interpolateVariables("No variables here", {});
    expect(result).toBe("No variables here");
  });

  it("should handle special characters in variable values", () => {
    const result = interpolateVariables("{{special}}", {
      special: "Value with $pecial ch@rs & symbols!",
    });
    expect(result).toBe("Value with $pecial ch@rs & symbols!");
  });

  it("should handle newlines in variable values", () => {
    const result = interpolateVariables("{{multiline}}", {
      multiline: "Line 1\nLine 2\nLine 3",
    });
    expect(result).toBe("Line 1\nLine 2\nLine 3");
  });

  it("should handle same variable used multiple times", () => {
    const result = interpolateVariables("{{model}} and {{model}} again", {
      model: "test-model",
    });
    expect(result).toBe("test-model and test-model again");
  });
});
