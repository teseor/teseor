# ADR-0017 — Strict token-interface boundary

- **Status:** Accepted.
- **Deciders:** repo owner (letanure).

## Decision

`@layer components.tokens` is the only place where global tokens (`var(--t-*)`)
are read. `@layer components.styles` references `var(--_*)` only, plus a small
allowlist of structural literals. Every token reference funnels through one
named alias in the `.tokens` block.

The lint rule that checks component CSS lands in two phases:

- **Phase 1** (this ADR's introduction): fails the build if a `var(--t-*)`
  appears anywhere inside `@layer components.styles` (including the
  component's own override-slot, `--t-<name>-*`).
- **Phase 2** (follow-up): adds the numeric-literal allowlist check to
  `.styles`. Authored after the Phase-1 migration settles so the exact
  allowlist boundary can be set against real component CSS.

Both phases share the same rule shape and are enforced by the same lint
file (`scripts/lint/file-rules/component-css.ts`).

## Why this and not "var(--t-*) anywhere"

- **Single interface boundary.** A component's external token surface is one
  reviewable block. Re-skinning the component means reading one block, not
  grepping the whole file. Themes that override `--t-surface` or
  `--t-accent` reach the component through one entry point.
- **Compiles "the token boundary" into the file shape.** ADR-0008 already
  prohibits hard-coded values in modifiers; ADR-0017 closes the remaining
  hole — modifiers that reach for `var(--t-space-2)` directly bypassed the
  alias layer and made the `.tokens` block partially load-bearing.
- **Forces every external value to have a *named* role.** A bare
  `var(--t-space-3)` in `.styles` means "this property eats this token"; a
  `--_gap` slot fed from `var(--t-tooltip-gap, var(--t-space-3))` means
  "this property eats the gap, which defaults to space-3, and consumers can
  override". The same number with two different surface contracts.
- **Mechanical lintability.** A regex (`var(--t-` outside `@layer
  components.tokens`) is enough. No AST walk over modifier selectors.

## Why not let modifiers read global tokens directly

`[data-size="sm"] { --_h: var(--t-row-2); }` is the most common case — a
modifier reassigns the local slot from a global scale. Keeping the read
inside the `.tokens` block means the size variants have to declare
`--_h-sm: var(--t-row-2);` and the base reads `--_h: var(--_h-sm);`,
which is one more indirection per variant value.

Rejected because:

- The current modifier pattern reads cleanly only when each variant maps to
  exactly one token. The moment a variant has to read two tokens (size's
  `--_h` + `--_pad-x` + `--_font-size`) the pattern smears across the rule.
- Variants are part of the component's interface contract: "size sm
  resolves to row-2". The `.tokens` block becomes the single readable
  manifest of that contract.
- The mechanical-lint win (one regex, one layer) outweighs the
  one-indirection-per-variant cost.

## Structural-literal allowlist

`.styles` may use these literals without aliasing through `--_*`:

| Literal | Use |
| --- | --- |
| `0` (any unit, including unitless) | Zero margin, padding, border, flex-shrink, opacity. |
| `1` (dimensionless) | Opacity reset, `line-height: 1`. |
| `1em` | Icon sizing intrinsic to local font-size. |
| `50%` | Centering transforms, circular border-radius. |
| `100%` | Full-extent dimensions. |

CSS keyword values (`flex`, `inline-flex`, `flex-start`, `currentColor`,
`transparent`, `revert`, `auto`, `none`, `inherit`, `pointer`, `center`,
…) pass through implicitly — they are property vocabulary, not magic
numbers.

Anything else dimensional or numeric — `2px`, `0.6`, `0.875rem`, `20rem` —
must alias through a `--_*` slot, even when the value is hard-coded and
the slot has no `var(--t-*)` fallback. The slot is the named role; the
fallback is whatever happens to back it.

## Consequences

- **`var(--t-*)` references concentrate in one place per component.** Every
  component CSS file has a readable manifest of its token surface.
- **`@layer components.styles` body is grep-stable**: `var(--_` is the only
  expected variable shape; `var(--t-` outside `.tokens` is a bug.
- **Variants that read globals through their own slot need a `.tokens`
  entry** — see button's size variants migrating to a per-size `--_h` /
  `--_pad-x` / `--_font-size` slot fed from the size scale.
- **Components currently reading scale tokens directly** (Tooltip's
  `--t-neutral-90`, Modal's `--t-neutral-0`, Code's `--t-neutral-20`)
  migrate to semantic surfaces (`--t-surface-inverse`,
  `--t-bg`, `--t-surface-muted`). The new lint rejects scale tokens
  inside any component CSS.
- **Tooling cost**: one rule extension to
  `scripts/lint/file-rules/component-css.ts`. Two layered checks — the
  cross-layer reference check and the literal-allowlist check.
- **ADR-0008 remains in force** for the broader token-driven model
  (modifiers reassign vars only, components own their box model, token
  references are real tokens or the component's own slot). This ADR
  tightens one of that ADR's corollaries: token references must additionally
  live in `.tokens`.

## References

- ADR-0008 — Token-driven component CSS.
- ADR-0003 — PostCSS build step (literal floors).
- `docs/architecture/three-tier-tokens.md` — Scale / Semantic / Component-public.
- `docs/rules/component-shape.md` — Rule #1 (two sublayers) + Rule #4 (token references).
