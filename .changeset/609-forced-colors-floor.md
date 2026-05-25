---
"@teseor/css": minor
---

`postcss-teseor-floor` now walks the `@media (forced-colors: active)` branch of `tokens.css` and synthesizes a nested forced-colors block on every component declaration whose chain resolves to a different system-color literal. A per-component CSS shipped without `tokens.css` now keeps its high-contrast mapping (e.g. `--t-accent → ButtonText`, `--t-focus-ring → Highlight`) in Windows High Contrast instead of falling back to the default-mode `oklch(...)` literal.
