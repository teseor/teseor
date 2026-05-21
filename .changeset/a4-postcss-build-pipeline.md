---
"@teseor/css": minor
---

Real PostCSS build pipeline (`postcss-import` + `postcss-each` + `postcss-custom-media`) replaces the stub `build` script. `dist/` now contains:

- `dist/teseor.css` — full bundle (reset + tokens + base + utilities) in layer order.
- `dist/tokens.css`, `dist/utilities.css`, `dist/tailwind.css` — individual entry points.

New utility classes (`t-` prefix): `t-p-{0..8}`, `t-px-{0..8}`, `t-py-{0..8}`, `t-m-{0..8}`, `t-mx-{0..8}`, `t-my-{0..8}`, `t-gap-{0..8}` over the `--t-space-*` scale; `t-block`, `t-inline`, `t-inline-block`, `t-flex`, `t-inline-flex`, `t-grid`, `t-inline-grid`, `t-contents`, `t-hidden`. Output is deterministic across runs. Size-limit budget added.
