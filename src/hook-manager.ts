/**
 * Manages temporary git commit-msg hooks with automatic cleanup via Disposable pattern.
 */
export class CommitHookManager implements Disposable {
  private readonly repoPath: string;
  private readonly trailers: Record<string, string>;

  constructor(repoPath: string, trailers: Record<string, string>) {
    this.repoPath = repoPath;
    this.trailers = trailers;
  }

  generateHookScript(): string {
    const trailerArgs: string[] = [];
    
    for (const [key, value] of Object.entries(this.trailers)) {
      const formattedKey: string = key.charAt(0).toUpperCase() + key.slice(1);
      trailerArgs.push(`--trailer "${formattedKey}: ${value}"`);
    }
    
    const script: string = `#!/bin/sh
git interpret-trailers ${trailerArgs.join(" ")} --in-place "$1"
`;
    
    return script;
  }

  [Symbol.dispose](): void {
    // Cleanup implementation will be added
  }
}
