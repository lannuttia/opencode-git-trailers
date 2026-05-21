/**
 * Checks if a command is a git commit command.
 * Handles both standalone and chained commands (using && or ;).
 * @param command - The command string to check
 * @returns True if the command contains "git commit"
 */
export function isGitCommitCommand(command: string): boolean {
  const trimmed = command.trim();
  
  // Check if it starts with "git commit"
  if (trimmed.startsWith("git commit")) {
    return true;
  }
  
  // Check for git commit in chained commands
  // Match: && git commit or ; git commit (with word boundaries)
  return /[;&]\s*git\s+commit\b/.test(command);
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

  // Match double-quoted strings, handling escaped quotes (\")
  const doubleQuoteMatch = command.match(/-m\s+"((?:\\"|[^"])*)"/);
  if (doubleQuoteMatch) {
    // Unescape the matched content
    return doubleQuoteMatch[1]
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
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
