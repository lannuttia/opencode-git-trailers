import type { Plugin } from "@opencode-ai/plugin";
import { readGitTrailers } from "./config.js";
import { isGitCommitCommand } from "./git-commit.js";
import { appendTrailersToCommand } from "./modify-command.js";
import { buildTrailers } from "./trailers.js";
import { getUserVariables, buildContextVariables } from "./variables.js";
import type { Variables } from "./types.js";

const plugin: Plugin = async (input) => {
  // Store model/provider in closure to access across hooks
  let currentModel: string | undefined;
  let currentProvider: string | undefined;

  return {
    "chat.params": async (hookInput) => {
      // Capture model and provider from chat parameters
      try {
        if (hookInput.model?.id) {
          currentModel = hookInput.model.id;
        }
        if (hookInput.provider?.info?.name) {
          currentProvider = hookInput.provider.info.name;
        }
      } catch {
        // Silently ignore errors in capturing model/provider
      }
    },

    "tool.execute.before": async (hookInput, output) => {
      try {
        // Only process bash tool
        if (hookInput.tool !== "bash") {
          return;
        }

        const command: string | undefined = output.args?.command;
        if (!command || !isGitCommitCommand(command)) {
          return;
        }

        // Read git trailer configuration
        const workdir = output.args?.workdir;
        const cwd: string = (typeof workdir === 'string' ? workdir : undefined) || input.directory;
        const trailerConfig: Record<string, string> = await readGitTrailers(input.$, cwd);

        if (Object.keys(trailerConfig).length === 0) {
          return;
        }

        // Collect all variables
        const userVars: Variables = await getUserVariables(input.$, cwd);
        const contextVars: Variables = buildContextVariables({
          session: hookInput.sessionID,
          model: currentModel,
          provider: currentProvider,
        });

        const allVariables: Variables = { ...userVars, ...contextVars };

        // Build and apply trailers
        const trailers: Record<string, string> = buildTrailers(
          trailerConfig,
          allVariables
        );
        
        const modifiedCommand: string = appendTrailersToCommand(command, trailers);

        output.args.command = modifiedCommand;
      } catch (error) {
        // Gracefully handle errors - don't break the commit
        // Log error for debugging but allow commit to proceed unchanged
        console.error("opencode-git-trailers: Error processing trailers:", error);
      }
    },
  };
};

export default plugin;
