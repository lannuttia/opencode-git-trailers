import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CommitHookManager } from "../src/hook-manager.js";
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";

describe("CommitHookManager", () => {
  describe("Disposable pattern", () => {
    it("should implement Symbol.dispose for cleanup", () => {
      const manager: CommitHookManager = new CommitHookManager("/test/repo", {});
      
      expect(manager[Symbol.dispose]).toBeDefined();
      expect(typeof manager[Symbol.dispose]).toBe("function");
    });
  });

  describe("generateHookScript", () => {
    it("should generate script with git interpret-trailers command", () => {
      const manager: CommitHookManager = new CommitHookManager("/test/repo", {
        "session": "test-session-123",
        "model": "claude-sonnet-4-5"
      });

      const script: string = manager.generateHookScript();

      expect(script).toContain("#!/bin/sh");
      expect(script).toContain("git interpret-trailers");
      expect(script).toContain("--trailer \"Session: test-session-123\"");
      expect(script).toContain("--trailer \"Model: claude-sonnet-4-5\"");
    });

    it("should chain to existing commit-msg hook if present", () => {
      const manager: CommitHookManager = new CommitHookManager("/test/repo", {
        "session": "test-session-123"
      }, "/test/repo/.git/hooks/commit-msg");

      const script: string = manager.generateHookScript();

      expect(script).toContain("#!/bin/sh");
      expect(script).toContain("/test/repo/.git/hooks/commit-msg.backup \"$1\"");
      expect(script).toContain("git interpret-trailers");
    });

    it("should not chain when no existing hook provided", () => {
      const manager: CommitHookManager = new CommitHookManager("/test/repo", {
        "session": "test-session-123"
      });

      const script: string = manager.generateHookScript();

      expect(script).not.toContain("/test/repo/.git/hooks/commit-msg");
    });
  });

  describe("installHook", () => {
    const testRepoPath: string = "/tmp/opencode/test-repo-hook-install";
    const hooksDir: string = join(testRepoPath, ".git", "hooks");
    const hookPath: string = join(hooksDir, "commit-msg");

    beforeEach(() => {
      // Clean up any existing test directory
      if (existsSync(testRepoPath)) {
        rmSync(testRepoPath, { recursive: true, force: true });
      }
      // Create fresh test directory structure
      mkdirSync(hooksDir, { recursive: true });
    });

    afterEach(() => {
      // Clean up after tests
      if (existsSync(testRepoPath)) {
        rmSync(testRepoPath, { recursive: true, force: true });
      }
    });

    it("should create hook file with generated script", () => {
      const manager: CommitHookManager = new CommitHookManager(testRepoPath, {
        "session": "test-123"
      });

      manager.installHook();

      expect(existsSync(hookPath)).toBe(true);
      const content: string = readFileSync(hookPath, "utf-8");
      expect(content).toContain("#!/bin/sh");
      expect(content).toContain("git interpret-trailers");
      expect(content).toContain("Session: test-123");
    });

    it("should make hook file executable", () => {
      const manager: CommitHookManager = new CommitHookManager(testRepoPath, {
        "session": "test-123"
      });

      manager.installHook();

      const stats = statSync(hookPath);
      // Check if file has execute permission (owner, group, or others)
      const isExecutable: boolean = (stats.mode & 0o111) !== 0;
      expect(isExecutable).toBe(true);
    });

    it("should backup existing commit-msg hook before overwriting", () => {
      const originalContent: string = "#!/bin/sh\necho 'original hook'\n";
      const backupPath: string = join(hooksDir, "commit-msg.backup");
      
      // Create an existing hook
      writeFileSync(hookPath, originalContent, { mode: 0o755 });
      
      const manager: CommitHookManager = new CommitHookManager(testRepoPath, {
        "session": "test-123"
      }, hookPath);

      manager.installHook();

      // Verify backup was created with original content
      expect(existsSync(backupPath)).toBe(true);
      const backupContent: string = readFileSync(backupPath, "utf-8");
      expect(backupContent).toBe(originalContent);
    });
  });

  describe("Symbol.dispose", () => {
    const testRepoPath: string = "/tmp/opencode/test-repo-dispose";
    const hooksDir: string = join(testRepoPath, ".git", "hooks");
    const hookPath: string = join(hooksDir, "commit-msg");

    beforeEach(() => {
      if (existsSync(testRepoPath)) {
        rmSync(testRepoPath, { recursive: true, force: true });
      }
      mkdirSync(hooksDir, { recursive: true });
    });

    afterEach(() => {
      if (existsSync(testRepoPath)) {
        rmSync(testRepoPath, { recursive: true, force: true });
      }
    });

    it("should remove hook file on dispose", () => {
      const manager: CommitHookManager = new CommitHookManager(testRepoPath, {
        "session": "test-123"
      });

      manager.installHook();
      expect(existsSync(hookPath)).toBe(true);

      manager[Symbol.dispose]();
      expect(existsSync(hookPath)).toBe(false);
    });

    it("should restore original hook from backup on dispose", () => {
      const originalContent: string = "#!/bin/sh\necho 'original hook'\n";
      const backupPath: string = join(hooksDir, "commit-msg.backup");
      
      // Create an existing hook
      writeFileSync(hookPath, originalContent, { mode: 0o755 });
      
      const manager: CommitHookManager = new CommitHookManager(testRepoPath, {
        "session": "test-123"
      }, hookPath);

      manager.installHook();
      
      // Verify the backup exists and hook is replaced
      expect(existsSync(backupPath)).toBe(true);
      expect(readFileSync(hookPath, "utf-8")).not.toBe(originalContent);

      manager[Symbol.dispose]();
      
      // Verify original hook is restored
      expect(existsSync(hookPath)).toBe(true);
      const restoredContent: string = readFileSync(hookPath, "utf-8");
      expect(restoredContent).toBe(originalContent);
      
      // Verify backup is cleaned up
      expect(existsSync(backupPath)).toBe(false);
    });
  });
});
