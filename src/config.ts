import type { ShellAPI } from "./types.js";

const TRAILER_PREFIX = "opencode.trailer.";

/**
 * Reads git trailer configuration from git config.
 * Looks for config keys starting with "opencode.trailer."
 * @param $shell - OpenCode's shell API
 * @param cwd - Current working directory
 * @returns Record of trailer configuration key-value pairs
 */
export async function readGitTrailers($shell: ShellAPI, cwd: string): Promise<Record<string, string>> {
  const configOutput = await $shell`git config --get-regexp '^opencode\.trailer\.'`
    .cwd(cwd)
    .nothrow()
    .quiet()
    .text();

  if (!configOutput.trim()) {
    return {};
  }

  const trailers: Record<string, string> = {};
  const lines = configOutput.trim().split("\n");

  for (const line of lines) {
    const spaceIndex = line.indexOf(" ");
    if (spaceIndex === -1) continue;

    const fullKey = line.substring(0, spaceIndex);
    const value = line.substring(spaceIndex + 1);
    const trailerName = fullKey.substring(TRAILER_PREFIX.length);

    trailers[trailerName] = value;
  }

  return trailers;
}
