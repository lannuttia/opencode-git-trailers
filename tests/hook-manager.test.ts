import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CommitHookManager } from "../src/hook-manager.js";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, statSync, readdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { execSync } from "child_process";

describe("CommitHookManager", () => {
  describe("Disposable pattern", () => {
    it("should implement Symbol.dispose for cleanup", () => {
      const manager: CommitHookManager = new CommitHookManager("/test/repo", {});
      
      expect(manager[Symbol.dispose]).toBeDefined();
      expect(typeof manager[Symbol.dispose]).toBe("function");
    });
  });

  describe("resolveHooksDir integration", () => {
    let testRepoPath: string;

    beforeEach(() => {
      // Create a unique temporary git repository for each test
      testRepoPath = mkdtempSync(join(tmpdir(), "git-trailers-resolve-"));
      execSync("git init", { cwd: testRepoPath, stdio: "pipe" });
    });

    afterEach(() => {
      if (existsSync(testRepoPath)) {
        rmSync(testRepoPath, { recursive: true, force: true });
      }
    });

    it("should resolve hooks directory from real git repo without errors", () => {
      // Creating a manager should call resolveHooksDir which runs git rev-parse
      // This should work without errors since we initialized a real git repo
      const manager: CommitHookManager = new CommitHookManager(testRepoPath, {
        "test": "value"
      });

      // Verify the manager was created successfully
      expect(manager).toBeDefined();
      expect(manager.generateHookScript()).toContain("git interpret-trailers");
    });
  });

  describe("generateHookScript", () => {
    it("should generate script with git interpret-trailers command using key:value format", () => {
      const manager: CommitHookManager = new CommitHookManager("/test/repo", {
        "session": "test-session-123",
        "model": "claude-sonnet-4-5"
      });

      const script: string = manager.generateHookScript();

      expect(script).toContain("#!/bin/sh");
      expect(script).toContain("git interpret-trailers");
      expect(script).toContain("--trailer \"session:test-session-123\"");
      expect(script).toContain("--trailer \"model:claude-sonnet-4-5\"");
    });

    it("should chain to existing commit-msg hook if present", () => {
      const manager: CommitHookManager = new CommitHookManager("/test/repo", {
        "session": "test-session-123"
      }, "/test/repo/.git/hooks/commit-msg");

      const script: string = manager.generateHookScript();

      expect(script).toContain("#!/bin/sh");
      expect(script).toMatch(/\/test\/repo\/\.git\/hooks\/commit-msg\.backup-\d+-[a-f0-9]+ "\$1"/);
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
    let testRepoPath: string;
    let hooksDir: string;
    let hookPath: string;

    beforeEach(() => {
      // Create a unique temporary git repository for each test
      testRepoPath = mkdtempSync(join(tmpdir(), "git-trailers-install-"));
      execSync("git init", { cwd: testRepoPath, stdio: "pipe" });
      hooksDir = join(testRepoPath, ".git", "hooks");
      hookPath = join(hooksDir, "commit-msg");
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
      expect(content).toContain("session:test-123");
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
      
      // Create an existing hook
      writeFileSync(hookPath, originalContent, { mode: 0o755 });
      
      const manager: CommitHookManager = new CommitHookManager(testRepoPath, {
        "session": "test-123"
      }, hookPath);

      manager.installHook();

      // Verify a backup was created with original content
      const files: string[] = readdirSync(hooksDir);
      const backupFiles: string[] = files.filter(f => f.startsWith("commit-msg.backup-"));
      expect(backupFiles.length).toBe(1);
      
      const backupPath: string = join(hooksDir, backupFiles[0]);
      const backupContent: string = readFileSync(backupPath, "utf-8");
      expect(backupContent).toBe(originalContent);
    });

    it("should use unique backup filename to avoid collisions", () => {
      const originalContent: string = "#!/bin/sh\necho 'original hook'\n";
      const existingBackupContent: string = "#!/bin/sh\necho 'old backup'\n";
      const existingBackupPath: string = join(hooksDir, "commit-msg.backup");
      
      // Create an existing hook
      writeFileSync(hookPath, originalContent, { mode: 0o755 });
      
      // Create a pre-existing backup file that should NOT be overwritten
      writeFileSync(existingBackupPath, existingBackupContent, { mode: 0o755 });
      
      const manager: CommitHookManager = new CommitHookManager(testRepoPath, {
        "session": "test-123"
      }, hookPath);

      manager.installHook();

      // Verify existing backup file is unchanged
      expect(existsSync(existingBackupPath)).toBe(true);
      const unchangedBackup: string = readFileSync(existingBackupPath, "utf-8");
      expect(unchangedBackup).toBe(existingBackupContent);
      
      // Verify a new unique backup was created (not the .backup file)
      const files: string[] = readdirSync(hooksDir);
      const backupFiles: string[] = files.filter(f => f.startsWith("commit-msg.backup-"));
      expect(backupFiles.length).toBe(1);
      
      const uniqueBackupPath: string = join(hooksDir, backupFiles[0]);
      const backupContent: string = readFileSync(uniqueBackupPath, "utf-8");
      expect(backupContent).toBe(originalContent);
    });
  });

  describe("Symbol.dispose", () => {
    let testRepoPath: string;
    let hooksDir: string;
    let hookPath: string;

    beforeEach(() => {
      // Create a unique temporary git repository for each test
      testRepoPath = mkdtempSync(join(tmpdir(), "git-trailers-dispose-"));
      execSync("git init", { cwd: testRepoPath, stdio: "pipe" });
      hooksDir = join(testRepoPath, ".git", "hooks");
      hookPath = join(hooksDir, "commit-msg");
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
      
      // Create an existing hook
      writeFileSync(hookPath, originalContent, { mode: 0o755 });
      
      const manager: CommitHookManager = new CommitHookManager(testRepoPath, {
        "session": "test-123"
      }, hookPath);

      manager.installHook();
      
      // Verify a backup was created and hook is replaced
      let files: string[] = readdirSync(hooksDir);
      let backupFiles: string[] = files.filter(f => f.startsWith("commit-msg.backup-"));
      expect(backupFiles.length).toBe(1);
      expect(readFileSync(hookPath, "utf-8")).not.toBe(originalContent);

      manager[Symbol.dispose]();
      
      // Verify original hook is restored
      expect(existsSync(hookPath)).toBe(true);
      const restoredContent: string = readFileSync(hookPath, "utf-8");
      expect(restoredContent).toBe(originalContent);
      
      // Verify backup is cleaned up
      files = readdirSync(hooksDir);
      backupFiles = files.filter(f => f.startsWith("commit-msg.backup-"));
      expect(backupFiles.length).toBe(0);
    });
  });

  describe("Error propagation from pre-existing hooks", () => {
    let testRepoPath: string;
    let hooksDir: string;
    let hookPath: string;
    let commitMsgFile: string;

    beforeEach(() => {
      testRepoPath = mkdtempSync(join(tmpdir(), "git-trailers-error-"));
      execSync("git init", { cwd: testRepoPath, stdio: "pipe" });
      execSync("git config user.name 'Test User'", { cwd: testRepoPath, stdio: "pipe" });
      execSync("git config user.email 'test@example.com'", { cwd: testRepoPath, stdio: "pipe" });
      hooksDir = join(testRepoPath, ".git", "hooks");
      hookPath = join(hooksDir, "commit-msg");
      commitMsgFile = join(testRepoPath, ".git", "COMMIT_EDITMSG");
    });

    afterEach(() => {
      if (existsSync(testRepoPath)) {
        rmSync(testRepoPath, { recursive: true, force: true });
      }
    });

    it("should propagate errors from failing non-piped commands in pre-existing hooks", () => {
      // Create a pre-existing hook that fails with a non-piped command
      const failingHook: string = "#!/bin/sh\nfalse\n";
      writeFileSync(hookPath, failingHook, { mode: 0o755 });
      
      const manager: CommitHookManager = new CommitHookManager(testRepoPath, {
        "session": "test-123"
      }, hookPath);

      manager.installHook();

      // Create a commit message file
      writeFileSync(commitMsgFile, "test commit\n");

      // Execute the installed hook - it should fail
      let exitCode: number = 0;
      try {
        execSync(`${hookPath} ${commitMsgFile}`, { cwd: testRepoPath, stdio: "pipe" });
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'status' in error) {
          exitCode = error.status as number;
        }
      }

      expect(exitCode).not.toBe(0);
      
      manager[Symbol.dispose]();
    });

    it("should propagate errors from failing commands in pipelines in pre-existing hooks", () => {
      // Create a pre-existing hook that fails in a pipeline
      // The hook has set -eo pipefail so the false in the pipeline will cause it to fail
      const failingPipelineHook: string = "#!/bin/sh\nset -eo pipefail\nfalse | true\n";
      writeFileSync(hookPath, failingPipelineHook, { mode: 0o755 });
      
      const manager: CommitHookManager = new CommitHookManager(testRepoPath, {
        "session": "test-123"
      }, hookPath);

      manager.installHook();

      // Create a commit message file
      writeFileSync(commitMsgFile, "test commit\n");

      // Execute the installed hook - it should fail
      let exitCode: number = 0;
      try {
        execSync(`${hookPath} ${commitMsgFile}`, { cwd: testRepoPath, stdio: "pipe" });
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'status' in error) {
          exitCode = error.status as number;
        }
      }

      expect(exitCode).not.toBe(0);
      
      manager[Symbol.dispose]();
    });
  });
});
