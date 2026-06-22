---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `Icon` atomic — wrapper for caller-supplied SVG glyphs. Renders `<span>` with three sizes (`sm | md | lg`) on Icon-owned size tokens (`--t-icon-size-sm/md/lg`), and an optional semantic color (`neutral | primary | success | warning | danger | info`) that maps to the matching token. Color defaults to `currentColor` so the SVG inherits the parent's text color when no override is set. Decorative by default (`aria-hidden="true"`); supply `label` to expose an accessible name and drop `aria-hidden`. Does not ship an icon set — the consumer supplies the SVG markup (Lucide, Tabler, Heroicons, custom). The caller's SVG must use `fill="currentColor"` or `stroke="currentColor"` for the `color` token to flow through.
