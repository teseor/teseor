---
"@teseor/css": minor
---

Phase 1 of tokens-v4 (RFC-0003). Spatial tokens (`--t-space-*`, `--t-row-*`, `--t-radius-{sm,md,lg,xl}`, `--t-touch-min`) now derive from a single `--t-unit` knob (default `0.25rem`). Resolved values are identical at scale 1. Override `--t-unit` in any subtree to rescale spacing, row heights, radii, and the touch-target floor coherently. New `rhythm-tokens` lint enforces that derived tokens trace to `var(--t-unit)` and that component sizing values read a token or stay on relative units. Tooltip gains a public `--t-tooltip-max-inline-size` slot (was a hardcoded `20rem`).
