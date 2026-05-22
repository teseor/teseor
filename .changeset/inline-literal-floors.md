---
"@teseor/css": minor
---

Component CSS now ships with a literal fallback inlined into every `--t-*` token reference, resolved from `tokens.css` at build time by the in-house `postcss-teseor-floor` plugin. A per-component file (`@teseor/css/components/button.css`) renders with correct default values even when `tokens.css` is absent — `var(--t-button-bg, var(--t-accent))` ships as `var(--t-button-bg, var(--t-accent, oklch(65% 0.18 250deg)))`. The build fails if component CSS references a `--t-*` token not declared in `tokens.css`.
