import { isGitCommitCommand, extractCommitMessage } from "./git-commit.js";
import { formatTrailers } from "./trailers.js";

/**
 * Escapes a string for use within double quotes in a shell command.
 * @param str - String to escape
 * @returns Escaped string safe for double-quoted context
 */
function escapeForDoubleQuotes(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

/**
 * Escapes a string for use within single quotes in a shell command.
 * @param str - String to escape
 * @returns Escaped string safe for single-quoted context
 */
function escapeForSingleQuotes(str: string): string {
  return str.replace(/'/g, "'\\''");
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

  const doubleQuoteMatch = command.match(/-m\s+"([^"]*)"/);
  if (doubleQuoteMatch) {
    const newMessage: string = `${message}\\n\\n${escapeForDoubleQuotes(formattedTrailers)}`;
    return command.replace(/-m\s+"([^"]*)"/, `-m "${newMessage}"`);
  }

  const singleQuoteMatch = command.match(/-m\s+'([^']*)'/);
  if (singleQuoteMatch) {
    const newMessage: string = `${message}\n\n${escapeForSingleQuotes(formattedTrailers)}`;
    return command.replace(/-m\s+'([^']*)'/, `-m '${newMessage}'`);
  }

  const unquotedMatch = command.match(/-m\s+(\S+)/);
  if (unquotedMatch) {
    const newMessage: string = `${message}\\n\\n${escapeForDoubleQuotes(formattedTrailers)}`;
    return command.replace(/-m\s+(\S+)/, `-m "${newMessage}"`);
  }

  return command;
}
