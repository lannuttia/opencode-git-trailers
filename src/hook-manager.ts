import { writeFileSync, chmodSync, unlinkSync, existsSync, copyFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

/**
 * Resolves the git hooks directory using git rev-parse.
 * @param repoPath - Path to the repository
 * @returns Absolute path to the hooks directory
 */
function resolveHooksDir(repoPath: string): string {
  try {
    const hooksDir: string = execSync("git rev-parse --git-path hooks", {
      cwd: repoPath,
      encoding: "utf-8",
    }).trim();
    
    // If the path is relative, join it with repoPath
    if (!hooksDir.startsWith("/")) {
      return join(repoPath, hooksDir);
    }
    
    return hooksDir;
  } catch {
    // Fallback to standard location if git command fails
    return join(repoPath, ".git", "hooks");
  }
}

/**
 * Manages temporary git commit-msg hooks with automatic cleanup via Disposable pattern.
 */
export class CommitHookManager implements Disposable {
  private readonly repoPath: string;
  private readonly trailers: Record<string, string>;
  private readonly existingHookPath?: string;
  private readonly hookPath: string;
  private installed: boolean;

  constructor(repoPath: string, trailers: Record<string, string>, existingHookPath?: string) {
    this.repoPath = repoPath;
    this.trailers = trailers;
    this.existingHookPath = existingHookPath;
    const hooksDir: string = resolveHooksDir(repoPath);
    this.hookPath = join(hooksDir, "commit-msg");
    this.installed = false;
  }

  generateHookScript(): string {
    const trailerArgs: string[] = [];
    
    for (const [key, value] of Object.entries(this.trailers)) {
      const formattedKey: string = key.charAt(0).toUpperCase() + key.slice(1);
      trailerArgs.push(`--trailer "${formattedKey}: ${value}"`);
    }
    
    let script: string = "#!/bin/sh\n";
    
    if (this.existingHookPath) {
      const backupPath: string = `${this.hookPath}.backup`;
      script += `${backupPath} "$1"\n`;
    }
    
    script += `git interpret-trailers ${trailerArgs.join(" ")} --in-place "$1"\n`;
    
    return script;
  }

  installHook(): void {
    // Backup existing hook if present
    if (this.existingHookPath && existsSync(this.existingHookPath)) {
      const backupPath: string = `${this.hookPath}.backup`;
      copyFileSync(this.existingHookPath, backupPath);
    }
    
    const script: string = this.generateHookScript();
    writeFileSync(this.hookPath, script, { mode: 0o755 });
    this.installed = true;
  }

  [Symbol.dispose](): void {
    if (this.installed && existsSync(this.hookPath)) {
      unlinkSync(this.hookPath);
      this.installed = false;
    }
  }
}
