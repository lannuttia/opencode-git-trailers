export function isGitCommitCommand(command: string): boolean {
  return command.trim().startsWith("git commit");
}

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

  return null;
}
