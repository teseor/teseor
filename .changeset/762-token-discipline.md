---
"@teseor/css": minor
---

Tighten component CSS to a strict token-interface boundary: `@layer components.tokens` is the only place where global tokens (`var(--t-*)`) are read; `@layer components.styles` reads `var(--_*)` slots only.

User-visible changes in `@teseor/css`:

- New semantic surface tokens: `--t-surface-muted` / `--t-on-surface-muted` (inset / de-emphasized — code, codeblock) and `--t-surface-inverse` / `--t-on-surface-inverse` (light-on-dark — tooltip). Themes can override these in the same way as `--t-surface`.
- Component CSS migrated to consume the semantic surfaces instead of scale tokens (Tooltip's body fill, Modal's surface, Code/Codeblock's well).
- New `--t-tooltip-font-size` public override slot.

Behavior for consumers is unchanged — every migrated default still resolves to the same scale token as before. The migration is structural: scale-token references collected into the `.tokens` alias block, modifier rules now read `--_*` slots. A new lint (`scripts/lint/file-rules/component-css.ts`) rejects `var(--t-*)` references inside `@layer components.styles`.

Also adds `specs/_tokens.yaml`, a canonical-name dictionary that gates spec-time spelling of common token names (`bg`, `fg`, `pad-x`, …); per-spec `fallback:` stays required, the dictionary rejects longhand spellings (`background`, `borderRadius`, …).
