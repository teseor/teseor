---
"@teseor/css": minor
---

WCAG-AA defaults + derived intent foregrounds (RFC-0004 phase 4) + dist minify + Button info intent.

- Anchor lightnesses retuned so white-on-color passes WCAG AA at the default seed: `--t-accent` 0.58→0.55, `--t-success` 0.62→0.52, `--t-warning` 0.68→0.80 (fixes the muddy-mustard visual; warning now reads as real yellow), `--t-info` 0.55→0.50. `--t-danger` unchanged at 0.48. Ramp steps below the anchor recalculated to keep the 50→900 ladder monotonic.
- `--t-on-{intent}` foregrounds become `oklch(from var(--t-{intent}) max(0, sign(0.62 - l)) 0 h)` — pick black or white from the intent's own lightness. Consumer overrides like `--t-warning: pink` keep AA contrast automatically; no `--t-on-*` companion needed.
- Dist CSS now strips comments + collapses formatting whitespace at build. `teseor.css` drops from 8.03 kB → 5.34 kB brotlied (~34% reduction). No dep added; uses existing postcss pipeline.
- `Button` gains an `info` intent, mapping `bg: --t-info`, `fg: --t-on-info`. Symmetry with the other four DS intents.

Visual diff: success/info buttons darken slightly so white text passes AA. Warning lifts to vivid yellow with black text. Consumers who pinned the old defaults via `--t-seed` overrides keep their pins; only the anchor lightness math changes.
