import type { Plugin } from "@opencode-ai/plugin";
import { readGitTrailers } from "./config.js";
import { isGitCommitCommand } from "./git-commit.js";
import { appendTrailersToCommand } from "./modify-command.js";
import { buildTrailers } from "./trailers.js";
import { getUserVariables, buildContextVariables } from "./variables.js";
import type { Variables } from "./types.js";
import { CommitHookManager } from "./hook-manager.js";
import { existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const plugin: Plugin = async (input) => {
  // Store model/provider in closure to access across hooks
  let currentModel: string | undefined;
  let currentProvider: string | undefined;
  
  // Store hook manager per call ID for cleanup
  const hookManagers: Map<string, CommitHookManager> = new Map();

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

        // Build trailers
        const trailers: Record<string, string> = buildTrailers(
          trailerConfig,
          allVariables
        );
        
        // Check for existing commit-msg hook
        let existingHookPath: string | undefined;
        try {
          const hooksDir: string = execSync("git rev-parse --git-path hooks", {
            cwd,
            encoding: "utf-8",
          }).trim();
          
          const hookPath: string = hooksDir.startsWith("/") 
            ? join(hooksDir, "commit-msg")
            : join(cwd, hooksDir, "commit-msg");
          
          if (existsSync(hookPath)) {
            existingHookPath = hookPath;
          }
        } catch {
          // Ignore errors finding existing hook
        }
        
        // Create and install hook manager
        const manager: CommitHookManager = new CommitHookManager(cwd, trailers, existingHookPath);
        manager.installHook();
        
        // Store for cleanup in after hook
        hookManagers.set(hookInput.callID, manager);
      } catch (error) {
        // Gracefully handle errors - don't break the commit
        // Log error for debugging but allow commit to proceed unchanged
        console.error("opencode-git-trailers: Error processing trailers:", error);
      }
    },
    
    "tool.execute.after": async (hookInput) => {
      // Clean up hook if it was installed
      const manager: CommitHookManager | undefined = hookManagers.get(hookInput.callID);
      if (manager) {
        manager[Symbol.dispose]();
        hookManagers.delete(hookInput.callID);
      }
    },
  };
};

export default plugin;
