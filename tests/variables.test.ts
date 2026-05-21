import { describe, it, expect, vi } from "vitest";
import { getUserVariables } from "../src/variables.js";
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
});
