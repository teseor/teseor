---
"@teseor/css": minor
"@teseor/docs": patch
---

Add `--t-seed` (the color cascade's sole knob, default `oklch(65% 0.18 250deg)`) and `--t-harmony` (intent-drift slot, default `0`, reserved for the next phase) at `:root`. Refactor `--t-accent-{50..900}` to derive from the seed via `oklch(from var(--t-accent) <L> calc(c * <multiplier>) h)`. The `--t-accent` Tier-2 semantic alias now reads `var(--t-seed)` directly; the ramp steps read `--t-accent`. Resolved values are identical to the previous hand-tabulated palette at the default seed.

Override `--t-seed` at `:root` or any subtree to re-skin the accent family — the 50–900 ramp re-derives via CSS relative-color syntax (Baseline 2025). Existing per-step overrides (`--t-accent-500: oklch(...)`) keep working through the cascade. Neutral and intent ramps remain hand-authored; they migrate in the next phase.

Behavior change: overriding `--t-accent` now cascades into the accent ramp (and through it, `--t-focus-ring`). Previously the ramp was hand-tabulated and isolated from the semantic alias.

Adds `/themes` to the docs site — accent ramp + intent/neutral ramps for context + button examples + inline color pickers so reviewers can eyeball seed/intent overrides without devtools.
