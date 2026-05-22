/**
 * Shared type definitions for the opencode-git-trailers plugin.
 */

/**
 * Shell expression types accepted by Bun's shell API.
 */
export type ShellExpression =
  | { toString(): string }
  | Array<ShellExpression>
  | string
  | { raw: string }
  | ReadableStream;

/**
 * Chainable shell command interface returned by ShellAPI.
 */
export interface ShellChain {
  cwd(dir: string): ShellChain;
  nothrow(): ShellChain;
  quiet(): ShellChain;
  text(): Promise<string>;
}

/**
 * OpenCode's shell API for executing shell commands.
 * The values parameter accepts the same types as Bun's shell API.
 */
export type ShellAPI = {
  (strings: TemplateStringsArray, ...values: ShellExpression[]): ShellChain;
};

/**
 * Variables used for template interpolation.
 * Keys can be simple names (e.g., "model") or dot-separated paths (e.g., "user.name").
 */
export type Variables = Record<string, string | undefined>;
