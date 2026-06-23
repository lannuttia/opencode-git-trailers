import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PluginInput } from "@opencode-ai/plugin";

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

  it("should NOT modify git commit command when using hook manager", async () => {
    const mockShellChain = {
      text: vi.fn(),
      quiet: vi.fn(),
      nothrow: vi.fn(),
      cwd: vi.fn(),
    };

    mockShellChain.cwd.mockReturnValue(mockShellChain);
    mockShellChain.nothrow.mockReturnValue(mockShellChain);
    mockShellChain.quiet.mockReturnValue(mockShellChain);
    mockShellChain.text
      .mockResolvedValueOnce("opencode.git-trailers.session {{session}}")
      .mockResolvedValueOnce("John Doe")
      .mockResolvedValueOnce("john@example.com");

    const mockShell = vi.fn().mockReturnValue(mockShellChain);

    const mockInput: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: "/test/dir",
      worktree: "/test/worktree",
      experimental_workspace: { register: vi.fn() },
      serverUrl: new URL("http://localhost"),
      $: mockShell as any,
    };

    const hooks = await plugin(mockInput);
    const beforeHook = hooks["tool.execute.before"];
    const afterHook = hooks["tool.execute.after"];

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

    await beforeHook!(hookInput, output);

    // Command should NOT be modified when using hook manager
    expect(output.args.command).toBe('git commit -m "test commit"');
    
    // After hook should exist for cleanup
    expect(afterHook).toBeDefined();
  });

  it("should modify git commit commands with trailers", async () => {
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
      .mockResolvedValueOnce("opencode.git-trailers.session {{session}}")
      .mockResolvedValueOnce("John Doe")
      .mockResolvedValueOnce("john@example.com");

    // Mock the template tag function
    const mockShell = vi.fn().mockReturnValue(mockShellChain);

    const mockInput: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: "/test/dir",
      worktree: "/test/worktree",
      experimental_workspace: { register: vi.fn() },
      serverUrl: new URL("http://localhost"),
      $: mockShell as any,
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
    expect(output.args.command).toContain("Session:");
    expect(output.args.command).toContain("test-session");
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

  it("should capture model and provider from chat.params hook", async () => {
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
      .mockResolvedValueOnce("opencode.git-trailers.model {{model}}\nopencode.git-trailers.provider {{provider}}")
      .mockResolvedValueOnce("John Doe")
      .mockResolvedValueOnce("john@example.com");

    // Mock the template tag function
    const mockShell = vi.fn().mockReturnValue(mockShellChain);

    const mockInput: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: "/test/dir",
      worktree: "/test/worktree",
      experimental_workspace: { register: vi.fn() },
      serverUrl: new URL("http://localhost"),
      $: mockShell as any,
    };

    const hooks = await plugin(mockInput);

    // Simulate chat.params hook being called first
    if (hooks["chat.params"]) {
      const chatInput = {
        sessionID: "test-session",
        agent: "main",
        model: { id: "claude-sonnet-4-5" } as any,
        provider: { info: { name: "anthropic" } } as any,
        message: {} as any,
      };
      const chatOutput = {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: undefined,
        options: {},
      };
      await hooks["chat.params"]!(chatInput, chatOutput);
    }

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

    expect(output.args.command).toContain("Model: claude-sonnet-4-5");
    expect(output.args.command).toContain("Provider: anthropic");
  });

  it("should handle missing model.id gracefully in chat.params", async () => {
    const mockShellChain = {
      text: vi.fn(),
      quiet: vi.fn(),
      nothrow: vi.fn(),
      cwd: vi.fn(),
    };

    mockShellChain.cwd.mockReturnValue(mockShellChain);
    mockShellChain.nothrow.mockReturnValue(mockShellChain);
    mockShellChain.quiet.mockReturnValue(mockShellChain);
    mockShellChain.text
      .mockResolvedValueOnce("opencode.git-trailers.session {{session}}\nopencode.git-trailers.model {{model}}")
      .mockResolvedValueOnce("John Doe")
      .mockResolvedValueOnce("john@example.com");

    const mockShell = vi.fn().mockReturnValue(mockShellChain);

    const mockInput: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: "/test/dir",
      worktree: "/test/worktree",
      experimental_workspace: { register: vi.fn() },
      serverUrl: new URL("http://localhost"),
      $: mockShell as any,
    };

    const hooks = await plugin(mockInput);

    // Call chat.params with missing model.id
    if (hooks["chat.params"]) {
      const chatInput = {
        sessionID: "test-session",
        agent: "main",
        model: {} as any, // model exists but has no id
        provider: { info: { name: "anthropic" } } as any,
        message: {} as any,
      };
      const chatOutput = {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: undefined,
        options: {},
      };

      // Should not throw
      await hooks["chat.params"]!(chatInput, chatOutput);
    }

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

    // Trailers with only placeholder variables are filtered out
    // So only {{session}} with a real value should be added (session ID is provided)
    expect(output.args.command).toContain("Session: test-session");
    expect(output.args.command).not.toContain("Model:");
    expect(output.args.command).toContain("test commit");
  });

  it("should handle missing provider.info.name gracefully in chat.params", async () => {
    const mockShellChain = {
      text: vi.fn(),
      quiet: vi.fn(),
      nothrow: vi.fn(),
      cwd: vi.fn(),
    };

    mockShellChain.cwd.mockReturnValue(mockShellChain);
    mockShellChain.nothrow.mockReturnValue(mockShellChain);
    mockShellChain.quiet.mockReturnValue(mockShellChain);
    mockShellChain.text
      .mockResolvedValueOnce("opencode.git-trailers.session {{session}}\nopencode.git-trailers.provider {{provider}}")
      .mockResolvedValueOnce("John Doe")
      .mockResolvedValueOnce("john@example.com");

    const mockShell = vi.fn().mockReturnValue(mockShellChain);

    const mockInput: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: "/test/dir",
      worktree: "/test/worktree",
      experimental_workspace: { register: vi.fn() },
      serverUrl: new URL("http://localhost"),
      $: mockShell as any,
    };

    const hooks = await plugin(mockInput);

    // Call chat.params with missing provider.info.name
    if (hooks["chat.params"]) {
      const chatInput = {
        sessionID: "test-session",
        agent: "main",
        model: { id: "claude-sonnet-4-5" } as any,
        provider: {} as any, // provider exists but has no info.name
        message: {} as any,
      };
      const chatOutput = {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: undefined,
        options: {},
      };

      // Should not throw
      await hooks["chat.params"]!(chatInput, chatOutput);
    }

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

    // Trailers with only placeholder variables are filtered out
    // So only {{session}} with a real value should be added
    expect(output.args.command).toContain("Session: test-session");
    expect(output.args.command).not.toContain("Provider:");
    expect(output.args.command).toContain("test commit");
  });

  it("should not modify command when no trailers are configured", async () => {
    const mockShellChain = {
      text: vi.fn(),
      quiet: vi.fn(),
      nothrow: vi.fn(),
      cwd: vi.fn(),
    };

    mockShellChain.cwd.mockReturnValue(mockShellChain);
    mockShellChain.nothrow.mockReturnValue(mockShellChain);
    mockShellChain.quiet.mockReturnValue(mockShellChain);
    // Return empty config
    mockShellChain.text
      .mockResolvedValueOnce("")
      .mockResolvedValueOnce("John Doe")
      .mockResolvedValueOnce("john@example.com");

    const mockShell = vi.fn().mockReturnValue(mockShellChain);

    const mockInput: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: "/test/dir",
      worktree: "/test/worktree",
      experimental_workspace: { register: vi.fn() },
      serverUrl: new URL("http://localhost"),
      $: mockShell as any,
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

    // Command should remain unchanged when no trailers configured
    expect(output.args.command).toBe('git commit -m "test commit"');
  });

  it("should gracefully handle errors without breaking commits", async () => {
    // Mock console.error to suppress expected error output during test
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const mockShellChain = {
      text: vi.fn().mockRejectedValue(new Error("Git config failed")),
      quiet: vi.fn(),
      nothrow: vi.fn(),
      cwd: vi.fn(),
    };

    // Setup chain for all methods
    mockShellChain.cwd.mockReturnValue(mockShellChain);
    mockShellChain.nothrow.mockReturnValue(mockShellChain);
    mockShellChain.quiet.mockReturnValue(mockShellChain);

    // Mock the template tag function
    const mockShell = vi.fn().mockReturnValue(mockShellChain);

    const mockInput: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: "/test/dir",
      worktree: "/test/worktree",
      experimental_workspace: { register: vi.fn() },
      serverUrl: new URL("http://localhost"),
      $: mockShell as any,
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
    
    // Command should remain unchanged when error occurs
    expect(output.args.command).toBe('git commit -m "test commit"');
    
    // Verify that console.error was called with the expected message
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "opencode-git-trailers: Error processing trailers:",
      expect.any(Error)
    );
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
