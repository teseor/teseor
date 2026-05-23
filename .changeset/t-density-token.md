---
"@teseor/css": minor
---

Add `--t-density` multiplier and `--t-touch-min` floor to `tokens.css`. Spacing shorthands (`--t-pad-x`, `--t-pad-y`, `--t-gap`, `--t-row`) multiply by `--t-density`; `--t-row` is floored at `--t-touch-min` (44px @ 16px root) so a compact density cannot shrink an interactive root below the WCAG 2.5.5 touch target. `[data-density="compact"]` and `[data-density="comfortable"]` reassign `--t-density` (`0.875` / `1.125`) on the subtree they apply to.
