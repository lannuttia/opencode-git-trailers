import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PluginInput } from "@opencode-ai/plugin";
import { $ } from "bun";

vi.mock("bun", () => ({
  $: vi.fn(),
}));

import plugin from "../src/index.js";

describe("opencode-git-trailers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export a plugin function", () => {
    expect(plugin).toBeDefined();
    expect(typeof plugin).toBe("function");
  });

  it("should return hooks object with tool.execute.before", async () => {
    const mockInput: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: "/test/dir",
      worktree: "/test/worktree",
      experimental_workspace: { register: vi.fn() },
      serverUrl: new URL("http://localhost"),
      $: vi.fn() as any,
    };

    const hooks = await plugin(mockInput);
    expect(hooks).toBeDefined();
    expect(typeof hooks).toBe("object");
    expect(hooks["tool.execute.before"]).toBeDefined();
    expect(typeof hooks["tool.execute.before"]).toBe("function");
  });

  it("should modify git commit commands with trailers", async () => {
    const mockConfigShell = {
      text: vi.fn().mockResolvedValue("opencode.git-trailers.model {{model}}"),
      quiet: vi.fn().mockReturnThis(),
      nothrow: vi.fn().mockReturnThis(),
      cwd: vi.fn().mockReturnThis(),
    };

    const mockNameShell = {
      text: vi.fn().mockResolvedValue("John Doe"),
      quiet: vi.fn().mockReturnThis(),
      nothrow: vi.fn().mockReturnThis(),
      cwd: vi.fn().mockReturnThis(),
    };

    const mockEmailShell = {
      text: vi.fn().mockResolvedValue("john@example.com"),
      quiet: vi.fn().mockReturnThis(),
      nothrow: vi.fn().mockReturnThis(),
      cwd: vi.fn().mockReturnThis(),
    };

    vi.mocked($)
      .mockReturnValueOnce(mockConfigShell as any)
      .mockReturnValueOnce(mockNameShell as any)
      .mockReturnValueOnce(mockEmailShell as any);

    const mockInput: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: "/test/dir",
      worktree: "/test/worktree",
      experimental_workspace: { register: vi.fn() },
      serverUrl: new URL("http://localhost"),
      $: vi.fn() as any,
    };

    const hooks = await plugin(mockInput);
    const hookFn = hooks["tool.execute.before"];

    const hookInput = {
      tool: "bash",
      sessionID: "test-session",
      callID: "call-123",
    };

    const output = {
      args: {
        command: 'git commit -m "test commit"',
      },
    };

    await hookFn!(hookInput, output);

    // The command should be modified with trailers
    expect(output.args.command).toContain("Model:");
    expect(output.args.command).toContain("test commit");
  });

  it("should not modify non-bash tools", async () => {
    const mockInput: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: "/test/dir",
      worktree: "/test/worktree",
      experimental_workspace: { register: vi.fn() },
      serverUrl: new URL("http://localhost"),
      $: vi.fn() as any,
    };

    const hooks = await plugin(mockInput);
    const hookFn = hooks["tool.execute.before"];

    const hookInput = {
      tool: "read",
      sessionID: "test-session",
      callID: "call-123",
    };

    const output = {
      args: {
        filePath: "/test/file.txt",
      },
    };

    await hookFn!(hookInput, output);

    // The args should not be modified
    expect(output.args).toEqual({ filePath: "/test/file.txt" });
  });

  it("should not modify non-git-commit commands", async () => {
    const mockInput: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: "/test/dir",
      worktree: "/test/worktree",
      experimental_workspace: { register: vi.fn() },
      serverUrl: new URL("http://localhost"),
      $: vi.fn() as any,
    };

    const hooks = await plugin(mockInput);
    const hookFn = hooks["tool.execute.before"];

    const hookInput = {
      tool: "bash",
      sessionID: "test-session",
      callID: "call-123",
    };

    const output = {
      args: {
        command: "git status",
      },
    };

    await hookFn!(hookInput, output);

    // The command should not be modified
    expect(output.args.command).toBe("git status");
  });
});
