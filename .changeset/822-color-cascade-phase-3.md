---
"@teseor/css": minor
---

Retune the default `--t-seed` from `oklch(65% 0.18 250deg)` (blue, the v0.x accent) to `oklch(58% 0.2 268deg)` (indigo-violet). Pure value change — no API change, no token rename, no consumer code change required.

Why this shade: hue 268° steps out of the most-used CTA blue band (Tailwind blue, Bootstrap primary, MUI primary all sit ~240–250°). Lightness 0.58 lifts APCA contrast against white text past Lc 60 with margin (today's 0.65 sat near the floor). Chroma 0.20 gives the accent presence without crossing into neon. Intent hues stay canonical; harmonization remains opt-in via `--t-harmony`.

Visual diff for consumers who haven't overridden `--t-seed` or `--t-accent`. Consumers who want the v0.x palette can pin `--t-seed: oklch(65% 0.18 250deg);` in their `theme.css`.
