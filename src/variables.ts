import { $ } from "bun";
import type { Variables } from "./interpolate.js";

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
