import type { Plugin } from "@opencode-ai/plugin";
import { readGitTrailers } from "./config.js";
import { isGitCommitCommand } from "./git-commit.js";
import { modifyGitCommitCommand } from "./modify-command.js";
import { buildTrailers } from "./trailers.js";
import { getUserVariables, buildContextVariables } from "./variables.js";
import type { Variables } from "./interpolate.js";

const plugin: Plugin = async (input) => {
  return {
    "tool.execute.before": async (hookInput, output) => {
      // Only process bash tool
      if (hookInput.tool !== "bash") {
        return;
      }

      const command: string = output.args?.command;
      if (!command || !isGitCommitCommand(command)) {
        return;
      }

      // Read git trailer configuration
      const cwd: string = output.args?.workdir || input.directory;
      const trailerConfig: Record<string, string> = await readGitTrailers(cwd);

      if (Object.keys(trailerConfig).length === 0) {
        return;
      }

      // Collect all variables
      const userVars: Variables = await getUserVariables(cwd);
      const contextVars: Variables = buildContextVariables({
        session: hookInput.sessionID,
      });

      const allVariables: Variables = { ...userVars, ...contextVars };

      // Build and apply trailers
      const trailers: Record<string, string> = buildTrailers(
        trailerConfig,
        allVariables
      );
      const modifiedCommand: string = modifyGitCommitCommand(command, trailers);

      output.args.command = modifiedCommand;
    },
  };
};

export default plugin;
