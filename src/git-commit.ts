/**
 * Checks if a command is a git commit command.
 * @param command - The command string to check
 * @returns True if the command starts with "git commit"
 */
export function isGitCommitCommand(command: string): boolean {
  return command.trim().startsWith("git commit");
}

/**
 * Extracts the commit message from a git commit command.
 * Supports double-quoted, single-quoted, and unquoted message formats.
 * @param command - The git commit command
 * @returns The extracted commit message, or null if not found
 */
export function extractCommitMessage(command: string): string | null {
  if (!isGitCommitCommand(command)) {
    return null;
  }

  const doubleQuoteMatch = command.match(/-m\s+"([^"]*)"/);
  if (doubleQuoteMatch) {
    return doubleQuoteMatch[1];
  }

  const singleQuoteMatch = command.match(/-m\s+'([^']*)'/);
  if (singleQuoteMatch) {
    return singleQuoteMatch[1];
  }

  const unquotedMatch = command.match(/-m\s+(\S+)/);
  if (unquotedMatch) {
    return unquotedMatch[1];
  }

  return null;
}
