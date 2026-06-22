/**
 * HTML void elements per the WHATWG HTML Living Standard
 * (https://html.spec.whatwg.org/multipage/syntax.html#void-elements).
 * Void elements cannot have children and must be emitted as self-closing
 * in JSX / Vue templates / Astro.
 */
export const HTML_VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/** Whether `tag` is a void HTML element (case-insensitive). */
export function isVoidElement(tag: string): boolean {
  return HTML_VOID_ELEMENTS.has(tag.toLowerCase());
}

/** Subset of a spec the void-status check inspects. */
type SpecRootTag = {
  element?: string;
  elementByProp?: { prop: string; map: Record<string, string> };
};

/**
 * Classify an atomic spec's root tag by its void-ness:
 * - `never`: no void branches (renders with children)
 * - `all`: every possible root tag is void (self-closing always, `children?: never`)
 * - `mixed`: `elementByProp.map` has both void and non-void branches (runtime-branched)
 *
 * `spec.element` is checked first; with `elementByProp` the result is derived
 * from the map's values.
 */
export function specVoidStatus(spec: SpecRootTag): "never" | "all" | "mixed" {
  if (spec.element) {
    return isVoidElement(spec.element) ? "all" : "never";
  }
  if (spec.elementByProp) {
    const tags = Object.values(spec.elementByProp.map);
    if (tags.length === 0) return "never";
    const voidCount = tags.filter((t) => isVoidElement(t)).length;
    if (voidCount === 0) return "never";
    if (voidCount === tags.length) return "all";
    return "mixed";
  }
  return "never";
}

/**
 * Distinct void tag values from `elementByProp.map`, preserving first
 * occurrence. Used by generators to emit the `isVoidResolved` runtime check
 * for `mixed` specs (e.g. `resolved === 'hr' || resolved === 'br'`).
 */
export function voidTagsInMap(map: Record<string, string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of Object.values(map)) {
    if (!isVoidElement(tag)) continue;
    if (seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}
