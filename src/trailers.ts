import { interpolateVariables, type Variables } from "./interpolate.js";

/**
 * Formats trailers into git trailer format.
 * Each trailer is formatted as "Key: value" with the key capitalized.
 * @param trailers - Record of trailer key-value pairs
 * @returns Formatted trailers joined by newlines
 */
export function formatTrailers(trailers: Record<string, string>): string {
  const entries: string[] = [];
  for (const [key, value] of Object.entries(trailers)) {
    const formattedKey: string = key.charAt(0).toUpperCase() + key.slice(1);
    entries.push(`${formattedKey}: ${value}`);
  }
  return entries.join("\n");
}

/**
 * Builds trailers by interpolating variables into trailer templates.
 * Filters out empty values and uninterpolated variable placeholders.
 * @param config - Record of trailer templates with variable placeholders
 * @param variables - Record of variable values for interpolation
 * @returns Record of trailers with interpolated values
 */
export function buildTrailers(
  config: Record<string, string>,
  variables: Variables
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, template] of Object.entries(config)) {
    const value: string = interpolateVariables(template, variables);
    const trimmedValue: string = value.trim();
    if (trimmedValue && !trimmedValue.match(/^\{\{.*\}\}$/)) {
      result[key] = value;
    }
  }
  return result;
}
