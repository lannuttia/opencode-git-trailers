/**
 * Manages temporary git commit-msg hooks with automatic cleanup via Disposable pattern.
 */
export class CommitHookManager implements Disposable {
  private readonly repoPath: string;
  private readonly trailers: Record<string, string>;
  private readonly existingHookPath?: string;

  constructor(repoPath: string, trailers: Record<string, string>, existingHookPath?: string) {
    this.repoPath = repoPath;
    this.trailers = trailers;
    this.existingHookPath = existingHookPath;
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

  [Symbol.dispose](): void {
    // Cleanup implementation will be added
  }
}
