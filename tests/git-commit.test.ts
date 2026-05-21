import { describe, it, expect } from "vitest";
import { isGitCommitCommand, extractCommitMessage } from "../src/git-commit.js";

describe("git-commit", () => {
  describe("isGitCommitCommand", () => {
    it("should detect simple git commit command", () => {
      const command = 'git commit -m "Initial commit"';
      expect(isGitCommitCommand(command)).toBe(true);
    });

    it("should return false for non-commit git commands", () => {
      const command = "git status";
      expect(isGitCommitCommand(command)).toBe(false);
    });

    it("should return false for non-git commands", () => {
      const command = "npm install";
      expect(isGitCommitCommand(command)).toBe(false);
    });
  });

  describe("extractCommitMessage", () => {
    it("should extract message from -m flag with double quotes", () => {
      const command = 'git commit -m "Initial commit"';
      expect(extractCommitMessage(command)).toBe("Initial commit");
    });

    it("should extract message from -m flag with single quotes", () => {
      const command = "git commit -m 'Initial commit'";
      expect(extractCommitMessage(command)).toBe("Initial commit");
    });

    it("should return null for non-commit commands", () => {
      const command = "git status";
      expect(extractCommitMessage(command)).toBeNull();
    });
  });
});
