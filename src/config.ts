import { appendFileSync } from "fs";

type ShellAPI = {
  (strings: TemplateStringsArray, ...values: any[]): {
    cwd(dir: string): any;
    nothrow(): any;
    quiet(): any;
    text(): Promise<string>;
  };
};

const TRAILER_PREFIX = "opencode.git-trailers.";
const LOG_FILE = "/tmp/opencode-git-trailers-debug.log";

function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logLine = data 
    ? `[${timestamp}] ${message} ${JSON.stringify(data, null, 2)}\n`
    : `[${timestamp}] ${message}\n`;
  
  try {
    appendFileSync(LOG_FILE, logLine);
  } catch (error) {
    // Ignore
  }
}

/**
 * Reads git trailer configuration from git config.
 * Looks for config keys starting with "opencode.git-trailers."
 * @param $shell - OpenCode's shell API
 * @param cwd - Current working directory
 * @returns Record of trailer configuration key-value pairs
 */
export async function readGitTrailers($shell: ShellAPI, cwd: string): Promise<Record<string, string>> {
  debugLog("[config] About to call git config");
  
  const configOutput = await $shell`git config --get-regexp '^opencode\.git-trailers\.'`
    .cwd(cwd)
    .nothrow()
    .quiet()
    .text();

  debugLog("[config] Raw output from git config", { 
    output: configOutput,
    length: configOutput.length,
    trimmedLength: configOutput.trim().length 
  });

  if (!configOutput.trim()) {
    debugLog("[config] Output is empty after trim");
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
