import { $ } from "bun";

const TRAILER_PREFIX = "opencode.git-trailers.";

export async function readGitTrailers(cwd: string): Promise<Record<string, string>> {
  const configOutput = await $`git config --get-regexp '^opencode\\.git-trailers\\.'`
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
