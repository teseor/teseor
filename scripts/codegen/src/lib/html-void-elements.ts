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
