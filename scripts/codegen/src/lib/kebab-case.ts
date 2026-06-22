/**
 * Convert camelCase, PascalCase, or snake_case to kebab-case. Used when a
 * spec's camelCase prop name (`minHeight`) is interpolated into a DOM
 * `data-*` attribute name (`data-min-height`) — HTML lowercases the attribute
 * in the DOM and React 19 DEV warns on the camelCase form.
 */
export function kebabCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}
