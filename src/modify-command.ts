import { isGitCommitCommand, extractCommitMessage } from "./git-commit.js";
import { formatTrailers } from "./trailers.js";

function escapeForDoubleQuotes(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

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
  const newMessage: string = `${message}\\n\\n${escapeForDoubleQuotes(formattedTrailers)}`;

  return command.replace(/-m\s+"([^"]*)"/, `-m "${newMessage}"`);
}
