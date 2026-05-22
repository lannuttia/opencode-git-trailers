import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { modifyGitCommitCommand, escapeForAnsiCQuotes } from "../src/modify-command.js";

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

    // Execute the modified command using bash (required for $'...' syntax)
    execSync(modifiedCommand, { cwd: testRepo, shell: '/bin/bash' });

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

  it("should handle commit message with single quotes", () => {
    const originalCommand = "git commit --allow-empty -m 'Single quoted message'";
    const trailers = {
      "Session": "test123",
    };

    const modifiedCommand = modifyGitCommitCommand(originalCommand, trailers);
    execSync(modifiedCommand, { cwd: testRepo, shell: '/bin/bash' });

    const commitMessage = execSync("git log -1 --format=%B", {
      cwd: testRepo,
      encoding: "utf-8",
    });

    expect(commitMessage).toContain("Single quoted message");
    expect(commitMessage).toContain("Session: test123");
  });

  it("should handle commit message with special shell characters", () => {
    const originalCommand = 'git commit --allow-empty -m "Message with $pecial ch@rs!"';
    const trailers = {
      "Special": "test",
    };

    const modifiedCommand = modifyGitCommitCommand(originalCommand, trailers);
    execSync(modifiedCommand, { cwd: testRepo, shell: '/bin/bash' });

    const commitMessage = execSync("git log -1 --format=%B", {
      cwd: testRepo,
      encoding: "utf-8",
    });

    expect(commitMessage).toContain("Message with $pecial ch@rs!");
    expect(commitMessage).toContain("Special: test");
  });

  it("should handle trailer values with single quotes", () => {
    const originalCommand = 'git commit --allow-empty -m "Test"';
    const trailers = {
      "Value": "Contains 'single quotes' inside",
    };

    const modifiedCommand = modifyGitCommitCommand(originalCommand, trailers);
    execSync(modifiedCommand, { cwd: testRepo, shell: '/bin/bash' });

    const commitMessage = execSync("git log -1 --format=%B", {
      cwd: testRepo,
      encoding: "utf-8",
    });

    expect(commitMessage).toContain("Value: Contains 'single quotes' inside");
  });

  it("should handle trailer values with backslashes", () => {
    const originalCommand = 'git commit --allow-empty -m "Test"';
    const trailers = {
      "Path": "C:\\Users\\test\\path",
    };

    const modifiedCommand = modifyGitCommitCommand(originalCommand, trailers);
    execSync(modifiedCommand, { cwd: testRepo, shell: '/bin/bash' });

    const commitMessage = execSync("git log -1 --format=%B", {
      cwd: testRepo,
      encoding: "utf-8",
    });

    expect(commitMessage).toContain("Path: C:\\Users\\test\\path");
  });

  it("should return unmodified command for non-commit commands", () => {
    const originalCommand = "git status";
    const trailers = { "Model": "test" };
    
    const result = modifyGitCommitCommand(originalCommand, trailers);
    expect(result).toBe("git status");
  });

  it("should return unmodified command when no trailers provided", () => {
    const originalCommand = 'git commit -m "Test"';
    const trailers = {};
    
    const result = modifyGitCommitCommand(originalCommand, trailers);
    expect(result).toBe('git commit -m "Test"');
  });

  it("should return unmodified command when commit has no -m flag", () => {
    const originalCommand = "git commit";
    const trailers = { "Model": "test" };
    
    const result = modifyGitCommitCommand(originalCommand, trailers);
    expect(result).toBe("git commit");
  });

  it("should handle unquoted single-word commit message", () => {
    const originalCommand = "git commit --allow-empty -m test";
    const trailers = { "Session": "abc" };

    const modifiedCommand = modifyGitCommitCommand(originalCommand, trailers);
    execSync(modifiedCommand, { cwd: testRepo, shell: '/bin/bash' });

    const commitMessage = execSync("git log -1 --format=%B", {
      cwd: testRepo,
      encoding: "utf-8",
    });

    expect(commitMessage).toContain("test");
    expect(commitMessage).toContain("Session: abc");
  });

  it("should preserve command structure with flags after message", () => {
    const originalCommand = 'git commit -m "Test" --no-verify --allow-empty';
    const trailers = { "Model": "test" };

    const modifiedCommand = modifyGitCommitCommand(originalCommand, trailers);
    
    expect(modifiedCommand).toContain("--no-verify");
    expect(modifiedCommand).toContain("--allow-empty");
  });

  it("should handle chained commands with &&", () => {
    const originalCommand = 'git add . && git commit --allow-empty -m "Test"';
    const trailers = { "Session": "abc123" };

    const modifiedCommand = modifyGitCommitCommand(originalCommand, trailers);
    execSync(modifiedCommand, { cwd: testRepo, shell: '/bin/bash' });

    const commitMessage = execSync("git log -1 --format=%B", {
      cwd: testRepo,
      encoding: "utf-8",
    });

    expect(commitMessage).toContain("Test");
    expect(commitMessage).toContain("Session: abc123");
  });

  it("should handle chained commands with semicolon", () => {
    const originalCommand = 'git add .; git commit --allow-empty -m "Test2"';
    const trailers = { "Model": "test-model" };

    const modifiedCommand = modifyGitCommitCommand(originalCommand, trailers);
    execSync(modifiedCommand, { cwd: testRepo, shell: '/bin/bash' });

    const commitMessage = execSync("git log -1 --format=%B", {
      cwd: testRepo,
      encoding: "utf-8",
    });

    expect(commitMessage).toContain("Test2");
    expect(commitMessage).toContain("Model: test-model");
  });
});

describe("escapeForAnsiCQuotes", () => {
  it("should escape backslashes", () => {
    const result = escapeForAnsiCQuotes("path\\to\\file");
    expect(result).toBe("path\\\\to\\\\file");
  });

  it("should escape single quotes", () => {
    const result = escapeForAnsiCQuotes("it's a test");
    expect(result).toBe("it\\'s a test");
  });

  it("should escape newlines", () => {
    const result = escapeForAnsiCQuotes("line1\nline2");
    expect(result).toBe("line1\\nline2");
  });

  it("should escape carriage returns", () => {
    const result = escapeForAnsiCQuotes("text\rwith\rcarriage");
    expect(result).toBe("text\\rwith\\rcarriage");
  });

  it("should escape tabs", () => {
    const result = escapeForAnsiCQuotes("text\twith\ttabs");
    expect(result).toBe("text\\twith\\ttabs");
  });

  it("should escape null bytes", () => {
    const result = escapeForAnsiCQuotes("text\x00with\x00null");
    expect(result).toBe("text\\x00with\\x00null");
  });

  it("should handle multiple special characters", () => {
    const result = escapeForAnsiCQuotes("path\\file\nit's\ttesting\r\x00");
    expect(result).toBe("path\\\\file\\nit\\'s\\ttesting\\r\\x00");
  });

  it("should handle empty string", () => {
    const result = escapeForAnsiCQuotes("");
    expect(result).toBe("");
  });

  it("should handle string with no special characters", () => {
    const result = escapeForAnsiCQuotes("plain text");
    expect(result).toBe("plain text");
  });
});

describe("modifyGitCommitCommand - duplicate trailer detection", () => {
  it("should not add duplicate trailers if they already exist in the message", () => {
    const command = 'git commit -m "feat: add new feature\n\nModel: claude-sonnet-4-5\nCoding-agent: OpenCode"';
    const trailers = {
      "model": "claude-sonnet-4-5",
      "coding-agent": "OpenCode",
    };

    const modifiedCommand = modifyGitCommitCommand(command, trailers);

    // When all trailers already exist, command should remain unchanged
    expect(modifiedCommand).toBe(command);
  });

  it("should add trailers that don't already exist", () => {
    const command = 'git commit -m "feat: add new feature\n\nModel: claude-sonnet-4-5"';
    const trailers = {
      "model": "claude-sonnet-4-5",
      "coding-agent": "OpenCode",
      "session": "abc123",
    };

    const modifiedCommand = modifyGitCommitCommand(command, trailers);

    const match = modifiedCommand.match(/-m\s+\$'([^']*)'/);
    expect(match).not.toBeNull();
    
    const escapedMessage = match![1];
    const unescapedMessage = escapedMessage
      .replace(/\\n/g, "\n")
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, "\\");

    // Model should appear once (already existed)
    const modelCount = (unescapedMessage.match(/Model: claude-sonnet-4-5/g) || []).length;
    expect(modelCount).toBe(1);

    // Coding-agent and Session should be added (didn't exist)
    expect(unescapedMessage).toContain("Coding-agent: OpenCode");
    expect(unescapedMessage).toContain("Session: abc123");
  });

  it("should handle case-insensitive trailer key matching", () => {
    const command = 'git commit -m "feat: add feature\n\nmodel: claude-sonnet-4-5"';
    const trailers = {
      "model": "claude-sonnet-4-5",
    };

    const modifiedCommand = modifyGitCommitCommand(command, trailers);

    // When trailer already exists (case-insensitive), command should remain unchanged
    expect(modifiedCommand).toBe(command);
  });
});
