---
"@teseor/css": minor
---

`postcss-teseor-floor` now walks the `@media (forced-colors: active)` branch of `tokens.css` and emits a single nested forced-colors block at each component root that re-declares every semantic token the file references whose forced-colors literal differs from the default branch. Custom-property inheritance carries the system-color values (`--t-accent → ButtonText`, `--t-focus-ring → Highlight`, `--t-surface → Canvas`, …) to every reference in the subtree, so a per-component CSS shipped without `tokens.css` keeps its high-contrast mapping in Windows High Contrast instead of falling back to the default-mode `oklch(...)` literal.
