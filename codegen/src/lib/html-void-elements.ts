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

/**
 * Elements codegen treats as childless for spec purposes — HTML void elements
 * plus `<textarea>`. Textarea is not HTML-void (it carries content between
 * tags), but its content IS the value (set via `value` / `defaultValue`).
 * Form-control atoms must not expose `children` as a wrapper API surface;
 * codegen emits `children?: never` and skips `{children}` in the rendered
 * JSX. The literal HTML-void test stays in `HTML_VOID_ELEMENTS` /
 * `isVoidElement` for semantic checks (`polymorphic: 'asChild'` on void,
 * void-prop constraints) — only `specVoidStatus` consults this wider set.
 */
const CHILDLESS_FOR_CODEGEN = new Set([...HTML_VOID_ELEMENTS, "textarea"]);

/** Whether `tag` is a void HTML element (case-insensitive). */
export function isVoidElement(tag: string): boolean {
  return HTML_VOID_ELEMENTS.has(tag.toLowerCase());
}

/** Subset of a spec the void-status check inspects — the unified `root:`
 *  descriptor, in either the static or byProp branch. */
type SpecRootTag = {
  root?:
    | { kind: "static"; tag: string; polymorphic?: "asChild" }
    | { kind: "byProp"; prop: string; map: Record<string, string>; polymorphic?: "asChild" };
};

/**
 * Classify an atomic spec's root tag by codegen child-ness:
 * - `never`: root accepts children (renders with `{children}`)
 * - `all`: no codegen children allowed — emit `children?: never` + self-closing
 * - `mixed`: a byProp `map` has both child-bearing and childless branches
 *
 * The childless set is HTML void elements ∪ `{textarea}`. See
 * `CHILDLESS_FOR_CODEGEN` for rationale.
 */
export function specVoidStatus(spec: SpecRootTag): "never" | "all" | "mixed" {
  const root = spec.root;
  if (root?.kind === "static") {
    return CHILDLESS_FOR_CODEGEN.has(root.tag.toLowerCase()) ? "all" : "never";
  }
  if (root?.kind === "byProp") {
    const tags = Object.values(root.map);
    if (tags.length === 0) return "never";
    const childlessCount = tags.filter((t) => CHILDLESS_FOR_CODEGEN.has(t.toLowerCase())).length;
    if (childlessCount === 0) return "never";
    if (childlessCount === tags.length) return "all";
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
