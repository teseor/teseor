# ADR-0017 — Strict token-interface boundary

- **Status:** Accepted.
- **Deciders:** repo owner (letanure).

## Decision

`@layer components.tokens` is the only place where global tokens (`var(--t-*)`)
are read. `@layer components.styles` references `var(--_*)` slots only. Every
token reference funnels through one named alias declared in the `.tokens`
block. `scripts/lint/file-rules/component-css.ts` rejects `var(--t-*)`
references found inside `@layer components.styles`.

The numeric-literal allowlist for `.styles` ships as Phase 2 in a follow-up;
the rule shape (one regex, one layer) is the same.

## Why not let modifiers read global tokens directly

`[data-size="sm"] { --_h: var(--t-row-2); }` is the most common case — a
modifier reassigns the local slot from a global scale. Keeping the read
inside the `.tokens` block means the size variants declare
`--_h-sm: var(--t-row-2);` and the modifier reads `--_h: var(--_h-sm);`,
one extra indirection per variant value. Rejected because:

- The current modifier pattern reads cleanly only when each variant maps
  to exactly one token. The moment a variant has to read two tokens
  (size's `--_h` + `--_pad-x` + `--_font-size`) the pattern smears
  across the rule.
- Variants are part of the component's interface contract: "size sm
  resolves to row-2". The `.tokens` block becomes the single readable
  manifest of that contract — every external token a component depends
  on is one block to scan.
- The mechanical-lint win (one regex, one layer) outweighs the
  per-variant indirection cost.

## References

- ADR-0008 — Token-driven component CSS. ADR-0017 tightens its corollary
  "token references are real tokens or own slot" by adding the
  *where they appear* constraint.
- `docs/rules/component-shape.md` — Rules #1 (two sublayers) + #4
  (token references) carry the structural-literal allowlist and the
  migration consequences. Read there for the authoring contract.
