import { isGitCommitCommand, extractCommitMessage } from "./git-commit.js";
import { formatTrailers } from "./trailers.js";

function escapeForDoubleQuotes(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function escapeForSingleQuotes(str: string): string {
  return str.replace(/'/g, "'\\''");
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

  return command;
}
