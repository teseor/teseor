---
"@teseor/css": patch
---

Component CSS re-authored to a token-driven model: `components.tokens` declares every mutable value as a `--_*` custom property, the base reads those vars, and every `[data-*]` modifier reassigns vars only instead of declaring properties — so stacking variants, intents, and sizes is conflict-free. Rendered output is unchanged. Each component root now declares its own `box-sizing` and `margin` rather than leaning on `reset.css`, and `button` / `stack` / `cluster` gain `--t-button-gap`, `--t-stack-align`, `--t-cluster-align`, and `--t-cluster-justify` override slots.
