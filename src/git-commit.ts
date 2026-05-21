export function isGitCommitCommand(command: string): boolean {
  return command.trim().startsWith("git commit");
}

export function extractCommitMessage(command: string): string | null {
  if (!isGitCommitCommand(command)) {
    return null;
  }

  const match = command.match(/-m\s+"([^"]*)"/);
  return match ? match[1] : null;
}
