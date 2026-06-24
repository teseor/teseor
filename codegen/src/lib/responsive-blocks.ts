/** Top-level spec blocks whose auto-emitted wrapper prop is wrapped in
 *  `Responsive<T>`. Currently only `sizes` — `variants` / `intents` emit as
 *  plain unions. Single source of truth for wrapper generators (gen-react,
 *  gen-vue) and the docs Props table so the responsive flag stays in sync. */
export const RESPONSIVE_BLOCK_PROPS = new Set(["size"]);

export function isResponsiveBlockProp(name: string): boolean {
  return RESPONSIVE_BLOCK_PROPS.has(name);
}
