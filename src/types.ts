/**
 * Shared type definitions for the opencode-git-trailers plugin.
 */

/**
 * OpenCode's shell API for executing shell commands.
 */
export type ShellAPI = {
  (strings: TemplateStringsArray, ...values: any[]): {
    cwd(dir: string): any;
    nothrow(): any;
    quiet(): any;
    text(): Promise<string>;
  };
};

/**
 * Variables used for template interpolation.
 * Keys can be simple names (e.g., "model") or dot-separated paths (e.g., "user.name").
 */
export type Variables = Record<string, string | undefined>;
