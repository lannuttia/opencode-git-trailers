import { interpolateVariables, type Variables } from "./interpolate.js";

export function formatTrailers(trailers: Record<string, string>): string {
  const entries: string[] = [];
  for (const [key, value] of Object.entries(trailers)) {
    const formattedKey: string = key.charAt(0).toUpperCase() + key.slice(1);
    entries.push(`${formattedKey}: ${value}`);
  }
  return entries.join("\n");
}

export function buildTrailers(
  config: Record<string, string>,
  variables: Variables
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, template] of Object.entries(config)) {
    result[key] = interpolateVariables(template, variables);
  }
  return result;
}
