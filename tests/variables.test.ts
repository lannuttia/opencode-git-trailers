import { describe, it, expect, vi } from "vitest";
import { getUserVariables, buildContextVariables } from "../src/variables.js";
import { $ } from "bun";

vi.mock("bun", () => ({
  $: vi.fn(),
}));

describe("variables", () => {
  describe("getUserVariables", () => {
    it("should extract user.name and user.email from git config", async () => {
      const mockShellChain = {
        text: vi.fn(),
        quiet: vi.fn(),
        nothrow: vi.fn(),
        cwd: vi.fn(),
      };

      // Setup chain for all methods
      mockShellChain.cwd.mockReturnValue(mockShellChain);
      mockShellChain.nothrow.mockReturnValue(mockShellChain);
      mockShellChain.quiet.mockReturnValue(mockShellChain);
      mockShellChain.text
        .mockResolvedValueOnce("John Doe")
        .mockResolvedValueOnce("john@example.com");

      // Mock the template tag function
      const mockShell = vi.fn().mockReturnValue(mockShellChain);

      const vars = await getUserVariables(mockShell as any, "/tmp/repo");
      expect(vars).toEqual({
        "user.name": "John Doe",
        "user.email": "john@example.com",
      });

      // Verify the shell was called correctly
      expect(mockShell).toHaveBeenCalledTimes(2);
      expect(mockShellChain.cwd).toHaveBeenCalledWith("/tmp/repo");
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
