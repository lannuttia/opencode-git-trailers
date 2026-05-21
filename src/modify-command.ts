import { isGitCommitCommand, extractCommitMessage } from "./git-commit.js";
import { formatTrailers } from "./trailers.js";

/**
 * Escapes a string for use within $'...' ANSI-C quoting.
 * @param str - String to escape
 * @returns Escaped string safe for $'...' context
 */
export function escapeForAnsiCQuotes(str: string): string {
  return str
    .replace(/\\/g, "\\\\")    // Escape backslashes
    .replace(/'/g, "\\'")       // Escape single quotes
    .replace(/\n/g, "\\n")      // Convert newlines to \n escape sequence
    .replace(/\r/g, "\\r")      // Convert carriage returns to \r escape sequence
    .replace(/\t/g, "\\t")      // Convert tabs to \t escape sequence
    .replace(/\x00/g, "\\x00"); // Convert null bytes to \x00 escape sequence
}

/**
 * Modifies a git commit command to include trailers in the commit message.
 * Supports double-quoted, single-quoted, and unquoted message formats.
 * @param command - The git commit command to modify
 * @param trailers - Record of trailers to append to the message
 * @returns Modified command with trailers appended to the commit message
 */
export function modifyGitCommitCommand(
  command: string,
  trailers: Record<string, string>
): string {
  if (!isGitCommitCommand(command)) {
    return command;
  }

  if (Object.keys(trailers).length === 0) {
    return command;
  }

  const message: string | null = extractCommitMessage(command);
  if (!message) {
    return command;
  }

  const formattedTrailers: string = formatTrailers(trailers);
  
  // Build the new message with trailers using ANSI-C quoting ($'...')
  // This allows \n to be interpreted as actual newlines by the shell
  const escapedMessage: string = escapeForAnsiCQuotes(message);
  const escapedTrailers: string = escapeForAnsiCQuotes(formattedTrailers);
  const newMessage: string = `${escapedMessage}\\n\\n${escapedTrailers}`;

  // Replace the -m flag with $'...' syntax which interprets escape sequences
  // Match any of: -m "..." or -m '...' or -m word
  // Note: $$ in replacement string becomes a literal $ in the result
  return command.replace(/-m\s+(?:"[^"]*"|'[^']*'|\S+)/, "-m $$'" + newMessage + "'");
}
