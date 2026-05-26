---
"@teseor/css": minor
---

Phase 2 of tokens-v4 (RFC-0003). Text-size scale moves to `--t-unit`-multiples and leading derives from font-size via `round(up, 1em × ratio, var(--t-unit))`. Visual diff: text rows now land on the 4px grid at every step (was `text-base` only by coincidence). Sub-pixel resolved values become whole-pixel — `--t-text-xs` 12.64 → 12, `--t-text-2xl` 22.72 → 24, `--t-text-3xl` 25.6 → 32. `--t-leading-{tight,normal,loose}` are no longer constants — they resolve relative to the current font-size. Body text (`p`, `li`, `dd`, `blockquote`) opts into `text-box-trim: trim-both` under `@supports` so `padding-block` produces the visually-expected gap. Tooltip gains a public `--t-tooltip-leading` slot replacing its hardcoded `line-height: 1.4`.
