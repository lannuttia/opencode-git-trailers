import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { modifyGitCommitCommand } from "../src/modify-command.js";

describe("modifyGitCommitCommand", () => {
  let testRepo: string;

  beforeAll(() => {
    // Create a temporary git repository
    testRepo = mkdtempSync(join(tmpdir(), "git-commit-test-"));
    execSync("git init", { cwd: testRepo });
    execSync('git config user.name "Test User"', { cwd: testRepo });
    execSync('git config user.email "test@example.com"', { cwd: testRepo });
    execSync('git config commit.gpgsign false', { cwd: testRepo });
  });

  afterAll(() => {
    // Clean up test repository
    rmSync(testRepo, { recursive: true, force: true });
  });

  it("should create actual newlines in commit message when executed", () => {
    const originalCommand = 'git commit --allow-empty -m "Test commit"';
    const trailers = {
      "Model": "claude-sonnet-4-5",
      "Coding-agent": "OpenCode",
    };

    const modifiedCommand = modifyGitCommitCommand(originalCommand, trailers);
    
    console.log("Modified command:", modifiedCommand);

    // Execute the modified command
    execSync(modifiedCommand, { cwd: testRepo });

    // Read the commit message
    const commitMessage = execSync("git log -1 --format=%B", {
      cwd: testRepo,
      encoding: "utf-8",
    });

    // The commit message should have actual newlines, not literal \n
    expect(commitMessage).toContain("Test commit");
    expect(commitMessage).toContain("Model: claude-sonnet-4-5");
    expect(commitMessage).toContain("Coding-agent: OpenCode");
    
    // Verify the structure: message, blank line, trailers
    const lines = commitMessage.trim().split("\n");
    expect(lines[0]).toBe("Test commit");
    expect(lines[1]).toBe(""); // blank line
    expect(lines[2]).toBe("Model: claude-sonnet-4-5");
    expect(lines[3]).toBe("Coding-agent: OpenCode");
  });
});
