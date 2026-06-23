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
});
