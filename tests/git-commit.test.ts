import { describe, it, expect } from "vitest";
import { isGitCommitCommand, extractCommitMessage } from "../src/git-commit.js";

describe("git-commit", () => {
  describe("isGitCommitCommand", () => {
    it("should detect simple git commit command", () => {
      const command = 'git commit -m "Initial commit"';
      expect(isGitCommitCommand(command)).toBe(true);
    });

    it("should detect git commit with additional flags", () => {
      const command = 'git commit --allow-empty -m "Empty commit"';
      expect(isGitCommitCommand(command)).toBe(true);
    });

    it("should detect git commit with flags after message", () => {
      const command = 'git commit -m "Message" --no-verify';
      expect(isGitCommitCommand(command)).toBe(true);
    });

    it("should handle leading whitespace", () => {
      const command = '   git commit -m "test"';
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

    it("should return false for commands that contain 'git commit' but don't start with it", () => {
      const command = "echo git commit";
      expect(isGitCommitCommand(command)).toBe(false);
    });

    it("should detect git commit in chained commands with &&", () => {
      const command = 'git add . && git commit -m "test"';
      expect(isGitCommitCommand(command)).toBe(true);
    });

    it("should detect git commit in chained commands with ;", () => {
      const command = 'git add .; git commit -m "test"';
      expect(isGitCommitCommand(command)).toBe(true);
    });

    it("should detect git commit in chained commands with multiple stages", () => {
      const command = 'git add src/ && git add tests/ && git commit -m "test"';
      expect(isGitCommitCommand(command)).toBe(true);
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

    it("should extract unquoted single-word message", () => {
      const command = "git commit -m test";
      expect(extractCommitMessage(command)).toBe("test");
    });

    it("should extract message with special characters", () => {
      const command = 'git commit -m "feat: add feature (closes #123)"';
      expect(extractCommitMessage(command)).toBe("feat: add feature (closes #123)");
    });

    it("should extract message from command with flags before -m", () => {
      const command = 'git commit --allow-empty -m "Empty commit"';
      expect(extractCommitMessage(command)).toBe("Empty commit");
    });

    it("should extract message from command with flags after -m", () => {
      const command = 'git commit -m "Message" --no-verify';
      expect(extractCommitMessage(command)).toBe("Message");
    });

    it("should handle message with no spacing after -m", () => {
      const command = 'git commit -m"test"';
      expect(extractCommitMessage(command)).toBeNull();
    });

    it("should handle empty message in quotes", () => {
      const command = 'git commit -m ""';
      expect(extractCommitMessage(command)).toBe("");
    });

    it("should extract first message when multiple -m flags present", () => {
      const command = 'git commit -m "First line" -m "Second line"';
      expect(extractCommitMessage(command)).toBe("First line");
    });

    it("should return null for non-commit commands", () => {
      const command = "git status";
      expect(extractCommitMessage(command)).toBeNull();
    });

    it("should return null for commit without -m flag", () => {
      const command = "git commit";
      expect(extractCommitMessage(command)).toBeNull();
    });

    it("should extract message with escaped double quotes", () => {
      const command = 'git commit -m "She said \\"hello\\""';
      expect(extractCommitMessage(command)).toBe('She said "hello"');
    });

    it("should extract message with escaped backslashes and quotes", () => {
      const command = 'git commit -m "Path: C:\\\\Users\\\\test\\\\ and \\"quoted\\""';
      expect(extractCommitMessage(command)).toBe('Path: C:\\Users\\test\\ and "quoted"');
    });

    it("should extract message with escaped single quotes in double quotes", () => {
      const command = "git commit -m \"It\\'s working\"";
      expect(extractCommitMessage(command)).toBe("It\\'s working");
    });

    it("should extract message from chained command with &&", () => {
      const command = 'git add . && git commit -m "test message"';
      expect(extractCommitMessage(command)).toBe("test message");
    });

    it("should extract message from chained command with ;", () => {
      const command = 'git add .; git commit -m "test message"';
      expect(extractCommitMessage(command)).toBe("test message");
    });

    it("should extract message from complex chained command", () => {
      const command = 'git add src/ tests/ && git commit -m "feat: add feature" --no-verify';
      expect(extractCommitMessage(command)).toBe("feat: add feature");
    });
  });
});
