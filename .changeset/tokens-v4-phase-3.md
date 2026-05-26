---
"@teseor/css": major
migration: |
  ### `--t-density` removed; `[data-density]` mechanism changed

  **What changed.** `--t-density` (multiplier) is removed. The `[data-density="compact"]` and `[data-density="comfortable"]` modifiers no longer multiply four shorthand tokens by a density factor — they reassign `--t-unit` directly. Because Phase 1 (#812) made every spatial token derive from `--t-unit`, density now rescales the whole spatial system in the subtree: spacing rungs, row heights, radii, leading, text-size, and the four shorthands.

  **What this means for consumers.**

  - Any consumer reading `var(--t-density)` directly breaks. There are no known direct readers; the token existed for the four internal shorthands. If you did reference it, replace with reading `--t-unit` against the default `0.25rem`.
  - Any consumer using `[data-density="compact"]` and expecting *only* `--t-pad-x` / `--t-pad-y` / `--t-gap` / `--t-row` to tighten now sees the entire subtree tighten. A `<Stack gap="5">` inside the modifier finally shrinks (was 24px → now 21px). Previously you may have wrapped UIs in both `data-density="compact"` and a separate per-component sizing strategy; the second is no longer required.

  **`--t-touch-min` floor.** Now clamps to `2.75rem` via `max(calc(var(--t-unit) * 11), 2.75rem)` so compact density cannot shrink the WCAG 2.5.5 interactive target below 44px.

  **No codemod.** Names are unchanged; behavior shifts.
---

Phase 3 of tokens-v4 (RFC-0003). See migration above.
