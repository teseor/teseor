---
"@teseor/css": minor
---

Phase 3 of tokens-v4 (RFC-0003). **Public-API behavior change.** Density modifiers (`[data-density="compact"]` / `[data-density="comfortable"]`) now reassign `--t-unit` directly instead of the deprecated `--t-density` multiplier. The result: density scales the entire spatial system in the subtree — every spacing rung, row height, radius, leading, and text-size shifts proportionally, not just the four shorthands. A `<Stack gap="5">` inside `[data-density="compact"]` finally tightens (24px → 21px). `--t-density` is removed; the four spacing shorthands (`--t-pad-x`, `--t-pad-y`, `--t-gap`, `--t-row`) stay as plain aliases of the underlying rungs. `--t-touch-min` clamps to a 2.75rem floor via `max()` so compact density can never shrink the WCAG 2.5.5 touch target. No codemod — naming is unchanged; consumers that read `var(--t-density)` directly (none known) would break.
