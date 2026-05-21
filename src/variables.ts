import { $ } from "bun";
import type { Variables } from "./interpolate.js";

/**
 * Retrieves user variables from git config.
 * @param cwd - Current working directory
 * @returns Variables object with user.name and user.email
 */
export async function getUserVariables(cwd: string): Promise<Variables> {
  const name: string = await $`git config user.name`
    .cwd(cwd)
    .nothrow()
    .quiet()
    .text();

  const email: string = await $`git config user.email`
    .cwd(cwd)
    .nothrow()
    .quiet()
    .text();

  return {
    "user.name": name.trim(),
    "user.email": email.trim(),
  };
}

/**
 * Builds context variables from the current session and model information.
 * @param context - Context object with optional model, provider, and session
 * @returns Variables object with context information and current timestamp
 */
export function buildContextVariables(context: {
  model?: string;
  provider?: string;
  session?: string;
}): Variables {
  const variables: Variables = {};

  if (context.model) {
    variables.model = context.model;
  }

  if (context.provider) {
    variables.provider = context.provider;
  }

  if (context.session) {
    variables.session = context.session;
  }

  variables.timestamp = new Date().toISOString();

  return variables;
}
