import { $ } from "bun";

export async function readGitTrailers(cwd: string): Promise<Record<string, string>> {
  const configKeys = await $`git config --get-regexp '^opencode\\.git-trailers\\.'`
    .cwd(cwd)
    .nothrow()
    .quiet()
    .text();

  if (!configKeys.trim()) {
    return {};
  }

  const trailers: Record<string, string> = {};
  const keys = configKeys.trim().split("\n");

  for (const key of keys) {
    const trailerName = key.replace("opencode.git-trailers.", "");
    const value = await $`git config opencode.git-trailers.${trailerName}`
      .cwd(cwd)
      .nothrow()
      .quiet()
      .text();
    trailers[trailerName] = value.trim();
  }

  return trailers;
}
