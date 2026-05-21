import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { readGitTrailers } from "../src/config.js";

describe("readGitTrailers", () => {
  let testRepo: string;
  let mockShell: any;

  beforeAll(() => {
    // Create a temporary git repository
    testRepo = mkdtempSync(join(tmpdir(), "git-trailers-test-"));
    execSync("git init", { cwd: testRepo });
    execSync('git config user.name "Test User"', { cwd: testRepo });
    execSync('git config user.email "test@example.com"', { cwd: testRepo });
    
    // Set up test trailers
    execSync('git config opencode.git-trailers.model "{{model}}"', { cwd: testRepo });
    execSync('git config opencode.git-trailers.coding-agent "OpenCode"', { cwd: testRepo });

    // Create a mock shell API that calls real git
    mockShell = (strings: TemplateStringsArray, ...values: any[]) => {
      const command = strings.reduce((acc, str, i) => {
        return acc + str + (values[i] || "");
      }, "");

      let currentCwd = testRepo;
      let shouldThrow = true;
      let isQuiet = false;

      const chainable = {
        cwd(dir: string) {
          currentCwd = dir;
          return chainable;
        },
        nothrow() {
          shouldThrow = false;
          return chainable;
        },
        quiet() {
          isQuiet = true;
          return chainable;
        },
        async text(): Promise<string> {
          try {
            const result = execSync(command, {
              cwd: currentCwd,
              encoding: "utf-8",
              stdio: isQuiet ? ["pipe", "pipe", "pipe"] : undefined,
            });
            return result;
          } catch (error: any) {
            if (shouldThrow) {
              throw error;
            }
            return "";
          }
        },
      };

      return chainable;
    };
  });

  afterAll(() => {
    // Clean up test repository
    rmSync(testRepo, { recursive: true, force: true });
  });

  it("should read git trailers from config", async () => {
    const trailers = await readGitTrailers(mockShell, testRepo);

    expect(trailers).toEqual({
      model: "{{model}}",
      "coding-agent": "OpenCode",
    });
  });

  it("should return empty object when no trailers configured", async () => {
    const emptyRepo = mkdtempSync(join(tmpdir(), "git-trailers-empty-"));
    execSync("git init", { cwd: emptyRepo });
    
    const trailers = await readGitTrailers(mockShell, emptyRepo);
    
    expect(trailers).toEqual({});
    
    rmSync(emptyRepo, { recursive: true, force: true });
  });

  it("should handle trailer keys with hyphens", async () => {
    execSync('git config opencode.git-trailers.co-authored-by "{{user.name}}"', { cwd: testRepo });
    
    const trailers = await readGitTrailers(mockShell, testRepo);
    
    expect(trailers).toHaveProperty("co-authored-by", "{{user.name}}");
    
    // Clean up
    execSync('git config --unset opencode.git-trailers.co-authored-by', { cwd: testRepo });
  });

  it("should handle trailer values with spaces", async () => {
    execSync('git config opencode.git-trailers.message "A message with spaces"', { cwd: testRepo });
    
    const trailers = await readGitTrailers(mockShell, testRepo);
    
    expect(trailers).toHaveProperty("message", "A message with spaces");
    
    // Clean up
    execSync('git config --unset opencode.git-trailers.message', { cwd: testRepo });
  });

  it("should handle multiple trailer configurations", async () => {
    execSync('git config opencode.git-trailers.session "{{session}}"', { cwd: testRepo });
    execSync('git config opencode.git-trailers.timestamp "{{timestamp}}"', { cwd: testRepo });
    
    const trailers = await readGitTrailers(mockShell, testRepo);
    
    expect(Object.keys(trailers).length).toBeGreaterThanOrEqual(4);
    expect(trailers).toHaveProperty("session", "{{session}}");
    expect(trailers).toHaveProperty("timestamp", "{{timestamp}}");
    
    // Clean up
    execSync('git config --unset opencode.git-trailers.session', { cwd: testRepo });
    execSync('git config --unset opencode.git-trailers.timestamp', { cwd: testRepo });
  });
});
