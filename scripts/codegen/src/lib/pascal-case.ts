/**
 * Convert kebab-case or snake_case to PascalCase. Used by every generator
 * to build component identifier names from spec names.
 */
export function pascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((part) => (part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}
