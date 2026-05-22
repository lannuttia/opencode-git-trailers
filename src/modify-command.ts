import { isGitCommitCommand } from "./git-commit.js";
import { formatTrailers } from "./trailers.js";

/**
 * Escapes a string for use within $'...' ANSI-C quoting.
 * @param str - String to escape
 * @returns Escaped string safe for $'...' context
 */
function escapeForAnsiCQuotes(str: string): string {
  return str
    .replace(/\\/g, "\\\\")    // Escape backslashes
    .replace(/'/g, "\\'")       // Escape single quotes
    .replace(/\n/g, "\\n")      // Convert newlines to \n escape sequence
    .replace(/\r/g, "\\r")      // Convert carriage returns to \r escape sequence
    .replace(/\t/g, "\\t")      // Convert tabs to \t escape sequence
    // eslint-disable-next-line no-control-regex
    .replace(/\x00/g, "\\x00"); // Convert null bytes to \x00 escape sequence
}

/**
 * Appends trailers to a git commit command by adding an additional -m flag.
 * This is simpler than modifying the existing message and avoids complex escaping.
 * @param command - The git commit command to modify
 * @param trailers - Record of trailers to append
 * @returns Modified command with trailers appended via -m flag
 */
export function appendTrailersToCommand(
  command: string,
  trailers: Record<string, string>
): string {
  if (!isGitCommitCommand(command)) {
    return command;
  }

  if (Object.keys(trailers).length === 0) {
    return command;
  }

  // Check if command has -m flag
  if (!/-m\s+/.test(command)) {
    return command;
  }

  const formattedTrailers: string = formatTrailers(trailers);
  
  // Escape for ANSI-C quoting ($'...')
  const escapedTrailers: string = escapeForAnsiCQuotes(formattedTrailers);
  
  // Append -m flag with blank line and trailers using $'...' syntax
  // This allows \n to be interpreted as actual newlines
  return `${command} -m $'\\n${escapedTrailers}'`;
}
