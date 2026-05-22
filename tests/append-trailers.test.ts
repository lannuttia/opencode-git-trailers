import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { appendTrailersToCommand } from "../src/modify-command.js";

describe("appendTrailersToCommand", () => {
  let testRepo: string;

  beforeAll(() => {
    // Create a temporary git repository
    testRepo = mkdtempSync(join(tmpdir(), "git-append-test-"));
    execSync("git init", { cwd: testRepo });
    execSync('git config user.name "Test User"', { cwd: testRepo });
    execSync('git config user.email "test@example.com"', { cwd: testRepo });
    execSync('git config commit.gpgsign false', { cwd: testRepo });
  });

  afterAll(() => {
    // Clean up test repository
    rmSync(testRepo, { recursive: true, force: true });
  });

  it("should append trailers using additional -m flag", () => {
    const originalCommand = 'git commit --allow-empty -m "Test commit"';
    const trailers = {
      "Model": "claude-sonnet-4-5",
      "Coding-agent": "OpenCode",
    };

    const modifiedCommand = appendTrailersToCommand(originalCommand, trailers);

    // Execute the modified command
    execSync(modifiedCommand, { cwd: testRepo });

    // Read the commit message
    const commitMessage = execSync("git log -1 --format=%B", {
      cwd: testRepo,
      encoding: "utf-8",
    });

    // The commit message should have the original message and trailers
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

  it("should work with single-quoted messages", () => {
    const originalCommand = "git commit --allow-empty -m 'Single quoted'";
    const trailers = { "Session": "test123" };

    const modifiedCommand = appendTrailersToCommand(originalCommand, trailers);
    execSync(modifiedCommand, { cwd: testRepo });

    const commitMessage = execSync("git log -1 --format=%B", {
      cwd: testRepo,
      encoding: "utf-8",
    });

    expect(commitMessage).toContain("Single quoted");
    expect(commitMessage).toContain("Session: test123");
  });

  it("should work with unquoted single-word messages", () => {
    const originalCommand = "git commit --allow-empty -m test";
    const trailers = { "Session": "abc" };

    const modifiedCommand = appendTrailersToCommand(originalCommand, trailers);
    execSync(modifiedCommand, { cwd: testRepo });

    const commitMessage = execSync("git log -1 --format=%B", {
      cwd: testRepo,
      encoding: "utf-8",
    });

    expect(commitMessage).toContain("test");
    expect(commitMessage).toContain("Session: abc");
  });

  it("should preserve flags after the -m message", () => {
    const originalCommand = 'git commit -m "Test" --no-verify --allow-empty';
    const trailers = { "Model": "test" };

    const modifiedCommand = appendTrailersToCommand(originalCommand, trailers);
    
    expect(modifiedCommand).toContain("--no-verify");
    expect(modifiedCommand).toContain("--allow-empty");
    
    execSync(modifiedCommand, { cwd: testRepo });

    const commitMessage = execSync("git log -1 --format=%B", {
      cwd: testRepo,
      encoding: "utf-8",
    });

    expect(commitMessage).toContain("Test");
    expect(commitMessage).toContain("Model: test");
  });

  it("should work with chained commands using &&", () => {
    const originalCommand = 'git add . && git commit --allow-empty -m "Chained"';
    const trailers = { "Session": "abc123" };

    const modifiedCommand = appendTrailersToCommand(originalCommand, trailers);
    execSync(modifiedCommand, { cwd: testRepo });

    const commitMessage = execSync("git log -1 --format=%B", {
      cwd: testRepo,
      encoding: "utf-8",
    });

    expect(commitMessage).toContain("Chained");
    expect(commitMessage).toContain("Session: abc123");
  });

  it("should return unmodified command for non-commit commands", () => {
    const originalCommand = "git status";
    const trailers = { "Model": "test" };
    
    const result = appendTrailersToCommand(originalCommand, trailers);
    expect(result).toBe("git status");
  });

  it("should return unmodified command when no trailers provided", () => {
    const originalCommand = 'git commit -m "Test"';
    const trailers = {};
    
    const result = appendTrailersToCommand(originalCommand, trailers);
    expect(result).toBe('git commit -m "Test"');
  });

  it("should return unmodified command when commit has no -m flag", () => {
    const originalCommand = "git commit";
    const trailers = { "Model": "test" };
    
    const result = appendTrailersToCommand(originalCommand, trailers);
    expect(result).toBe("git commit");
  });

  it("should handle trailer values with special characters", () => {
    const originalCommand = 'git commit --allow-empty -m "Test"';
    const trailers = {
      "Value": "Contains 'single quotes' inside",
      "Path": "C:\\Users\\test\\path",
    };

    const modifiedCommand = appendTrailersToCommand(originalCommand, trailers);
    execSync(modifiedCommand, { cwd: testRepo });

    const commitMessage = execSync("git log -1 --format=%B", {
      cwd: testRepo,
      encoding: "utf-8",
    });

    expect(commitMessage).toContain("Value: Contains 'single quotes' inside");
    expect(commitMessage).toContain("Path: C:\\Users\\test\\path");
  });
});
