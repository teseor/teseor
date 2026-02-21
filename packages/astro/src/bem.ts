/**
 * Builds a BEM class string from a block name and modifier props.
 *
 * - Boolean `true` → `ui-{block}--{key}` (e.g. `block: true` → `ui-button--block`)
 * - String value   → `ui-{block}--{value}` (e.g. `variant: 'ghost'` → `ui-button--ghost`)
 * - `false` / `undefined` → skipped
 */
export function bemClasses(
  block: string,
  modifiers: Record<string, string | boolean | undefined>,
  extra?: string | null,
): string {
  const base = `ui-${block}`;
  const parts: string[] = [base];

  for (const [key, value] of Object.entries(modifiers)) {
    if (value === undefined || value === false) continue;
    parts.push(value === true ? `${base}--${key}` : `${base}--${value}`);
  }

  if (extra) parts.push(extra);
  return parts.join(' ');
}
