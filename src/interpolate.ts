import type { Variables } from "./types.js";

/**
 * Interpolates variables into a template string.
 * Variables are referenced using {{variableName}} or {{nested.path}} syntax.
 * Undefined variables are left as-is in the template.
 * @param template - Template string with variable placeholders
 * @param variables - Record of variable values
 * @returns Template with variables interpolated
 */
export function interpolateVariables(template: string, variables: Variables): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, key) => {
    return variables[key] ?? `{{${key}}}`;
  });
}
