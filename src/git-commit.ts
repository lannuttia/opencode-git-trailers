export function isGitCommitCommand(command: string): boolean {
  return command.trim().startsWith("git commit");
}
