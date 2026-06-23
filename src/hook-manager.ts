import { writeFileSync, chmodSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

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
    this.hookPath = join(repoPath, ".git", "hooks", "commit-msg");
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
      script += `${this.existingHookPath} "$1"\n`;
    }
    
    script += `git interpret-trailers ${trailerArgs.join(" ")} --in-place "$1"\n`;
    
    return script;
  }

  installHook(): void {
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
