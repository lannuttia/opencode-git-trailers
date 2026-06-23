import { describe, it, expect } from "vitest";
import { CommitHookManager } from "../src/hook-manager.js";

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
      expect(script).toContain("/test/repo/.git/hooks/commit-msg \"$1\"");
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
});
