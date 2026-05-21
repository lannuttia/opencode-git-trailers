export type Variables = Record<string, string>;

export function interpolateVariables(template: string, variables: Variables): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, key) => {
    return variables[key] ?? `{{${key}}}`;
  });
}
