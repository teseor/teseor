---
"@teseor/css": minor
"@teseor/docs": patch
---

Refactor `--t-neutral-{0..100}` and `--t-{success,warning,danger,info}-{50..900}` to derive from family anchors via `oklch(from var(--t-<family>) <L> calc(c * <multiplier>) h)`. New Tier-2 anchors at `:root`:

- `--t-neutral`: `oklch(from var(--t-seed) 50% calc(c * 0.025) h)` — seed-tinted gray.
- `--t-success`, `--t-warning`, `--t-danger`, `--t-info`: `color-mix(in oklch, oklch(from var(--t-seed) <L> c <canonical-hue>), oklch(from var(--t-seed) <L> c h) calc(var(--t-harmony) * 100%))` — canonical hue at `--t-harmony: 0`; drifts toward seed hue as `--t-harmony` rises toward `1`.

Adopt staggered per-family anchor lightness for color-blind separation under deuteranopia:

- `--t-success`: 62%
- `--t-warning`: 68%
- `--t-danger`: 48% (darker; separates from success luminance-wise)
- `--t-info`: 55%

Resolved values shift across the intent ramps — most notably danger gets darker (anchor 0.48 vs today's 0.62) and warning settles slightly under amber (anchor 0.68 vs 0.75). Neutral picks up a faint seed tint (chroma `0.18 × 0.025 ≈ 0.0045` at default seed). Consumers who pinned individual `--t-<family>-<step>` values keep their overrides via cascade.

The `--t-on-<intent>` semantic foregrounds keep their existing mappings. Override `--t-seed` to re-skin everything; override `--t-<family>` (e.g. `--t-danger: oklch(0.55 0.25 12)`) to pin a specific intent and let only its ramp re-derive.

Themes page (`/themes`) updates: harmony slider added; section headers describe the new derivation path.
