import { describe, it, expect, vi } from "vitest";
import { readGitTrailers } from "../src/config.js";
import { $ } from "bun";

vi.mock("bun", () => ({
  $: vi.fn(),
}));

describe("readGitTrailers", () => {
  it("should return empty object when no trailers configured", async () => {
    const mockShell = {
      text: vi.fn().mockResolvedValue(""),
      quiet: vi.fn().mockReturnThis(),
      nothrow: vi.fn().mockReturnThis(),
      cwd: vi.fn().mockReturnThis(),
    };
    vi.mocked($).mockReturnValue(mockShell as any);

    const trailers = await readGitTrailers("/tmp");
    expect(trailers).toEqual({});
  });

  it("should parse git config trailer values", async () => {
    const gitConfigOutput = `opencode.git-trailers.model {{model}}
opencode.git-trailers.co-authored-by AI Assistant <ai@opencode.ai>`;

    const mockShell = {
      text: vi.fn().mockResolvedValue(gitConfigOutput),
      quiet: vi.fn().mockReturnThis(),
      nothrow: vi.fn().mockReturnThis(),
      cwd: vi.fn().mockReturnThis(),
    };
    vi.mocked($).mockReturnValue(mockShell as any);

    const trailers = await readGitTrailers("/tmp/test-repo");
    expect(trailers).toEqual({
      model: "{{model}}",
      "co-authored-by": "AI Assistant <ai@opencode.ai>",
    });
  });
});
