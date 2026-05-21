import { describe, it, expect, vi } from "vitest";
import { getUserVariables, buildContextVariables } from "../src/variables.js";
import { $ } from "bun";

vi.mock("bun", () => ({
  $: vi.fn(),
}));

describe("variables", () => {
  describe("getUserVariables", () => {
    it("should extract user.name and user.email from git config", async () => {
      const mockShellName = {
        text: vi.fn().mockResolvedValue("John Doe"),
        quiet: vi.fn().mockReturnThis(),
        nothrow: vi.fn().mockReturnThis(),
        cwd: vi.fn().mockReturnThis(),
      };

      const mockShellEmail = {
        text: vi.fn().mockResolvedValue("john@example.com"),
        quiet: vi.fn().mockReturnThis(),
        nothrow: vi.fn().mockReturnThis(),
        cwd: vi.fn().mockReturnThis(),
      };

      vi.mocked($)
        .mockReturnValueOnce(mockShellName as any)
        .mockReturnValueOnce(mockShellEmail as any);

      const vars = await getUserVariables("/tmp/repo");
      expect(vars).toEqual({
        "user.name": "John Doe",
        "user.email": "john@example.com",
      });
    });
  });

  describe("buildContextVariables", () => {
    it("should build context variables", () => {
      const result = buildContextVariables({
        session: "test-session",
      });

      expect(result.session).toBe("test-session");
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it("should include model and provider when provided", () => {
      const result = buildContextVariables({
        session: "test-session",
        model: "claude-sonnet-4-5",
        provider: "anthropic",
      });

      expect(result.model).toBe("claude-sonnet-4-5");
      expect(result.provider).toBe("anthropic");
    });

    it("should handle partial context", () => {
      const context = {
        session: "xyz789",
      };

      const vars = buildContextVariables(context);

      expect(vars.model).toBeUndefined();
      expect(vars.provider).toBeUndefined();
      expect(vars.session).toBe("xyz789");
      expect(vars.timestamp).toBeDefined();
    });

    it("should always include timestamp", () => {
      const vars = buildContextVariables({});
      expect(vars.timestamp).toBeDefined();
      expect(typeof vars.timestamp).toBe("string");
      // Verify it's a valid ISO 8601 timestamp
      expect(() => new Date(vars.timestamp)).not.toThrow();
    });
  });
});
