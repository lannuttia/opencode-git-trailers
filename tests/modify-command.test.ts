import { describe, it, expect } from "vitest";
import { modifyGitCommitCommand } from "../src/modify-command.js";

describe("modify-command", () => {
  describe("modifyGitCommitCommand", () => {
    it("should append trailers to commit message", () => {
      const command = 'git commit -m "Initial commit"';
      const trailers = {
        "Model": "claude-sonnet-4-5",
        "Co-authored-by": "AI <ai@opencode.ai>",
      };
      const modified = modifyGitCommitCommand(command, trailers);
      expect(modified).toBe(
        'git commit -m "Initial commit\\n\\nModel: claude-sonnet-4-5\\nCo-authored-by: AI <ai@opencode.ai>"'
      );
    });

    it("should return original command for non-commit commands", () => {
      const command = "git status";
      const trailers = { "Model": "claude" };
      expect(modifyGitCommitCommand(command, trailers)).toBe(command);
    });

    it("should return original command when no trailers provided", () => {
      const command = 'git commit -m "test"';
      expect(modifyGitCommitCommand(command, {})).toBe(command);
    });

    it("should escape double quotes in trailer values", () => {
      const command = 'git commit -m "Initial commit"';
      const trailers = {
        "Model": 'claude-sonnet-4-5 "advanced"',
      };
      const modified = modifyGitCommitCommand(command, trailers);
      expect(modified).toBe(
        'git commit -m "Initial commit\\n\\nModel: claude-sonnet-4-5 \\"advanced\\""'
      );
    });

    it("should handle newlines in trailer values", () => {
      const command = 'git commit -m "Initial commit"';
      const trailers = {
        "Model": "claude\nsonnet",
      };
      const modified = modifyGitCommitCommand(command, trailers);
      expect(modified).toBe(
        'git commit -m "Initial commit\\n\\nModel: claude\\nsonnet"'
      );
    });

    it("should handle backslashes in trailer values", () => {
      const command = 'git commit -m "Initial commit"';
      const trailers = {
        "Path": "C:\\Users\\test",
      };
      const modified = modifyGitCommitCommand(command, trailers);
      expect(modified).toBe(
        'git commit -m "Initial commit\\n\\nPath: C:\\\\Users\\\\test"'
      );
    });
  });
});
