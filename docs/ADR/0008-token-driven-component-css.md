# ADR-0008 — Token-driven component CSS

- **Status:** Accepted.
- **Deciders:** repo owner (letanure).

## Context

A component's CSS has a base class and a set of modifiers — `variant`, `intent`, `size`, valued props — plus states (`:hover`, `[disabled]`, …). When a modifier declares a real property directly, stacking modifiers becomes a specificity-and-source-order puzzle: if `variant=outline` sets `background` and `intent=success` also sets `background`, the winner depends on which rule comes last. Every new modifier widens the conflict surface.

The first `button.css` was half-in: `intent` reassigned `--_*` vars, but `variant`, `size`, `block`, and `loading` set properties directly.

## Decision

One authoring model for every component.

1. **`components.tokens` is the component's complete mutable surface.** Every value that can vary — across variants, intents, sizes, states, or themes — is declared there as a `--_*` custom property. If a value can change, it is a token.
2. **The base class and descendant selectors declare the properties**, each reading a `--_*` var for its value (`background: var(--_bg)`).
3. **`[data-*]` modifiers reassign vars only.** A modifier rule is a block of `--_*` reassignments; it never declares a real property.
4. **State rules** (`:hover`, `:focus-visible`, `[disabled]`, …) reassign vars for what they change. Genuinely-fixed structure — the focus outline — may be declared directly.

Two corollaries of "a component file is self-contained":

- **A component owns its box model.** It declares its own `box-sizing` and `margin`; it never leans on a reset. A `<button>` carries a UA margin — the component zeroes it, not `reset.css`.
- **Token references are real tokens or the component's own slot.** Every `--t-*` a component reads is either declared in `tokens.css` or matches `--t-{component}-*`, its public override slot. Nothing else — a typo'd `--t-buton-bg` is otherwise indistinguishable from a real slot.

Because modifiers only reassign tokens, stacking `variant + intent + size` is conflict-free: `:where()` flattens specificity to the single root class, source order settles "last wins" per token, and tokens that do not collide never interact. `components.tokens` becomes a readable manifest of everything the component exposes.

## Why not a `component.modifier` cascade layer

A dedicated `@layer` for modifier rules would order them above the base. But the var discipline already removes property-level conflict — modifiers reassign tokens, the base reads each token once. A layer would have no cascade job to do. The `components.tokens` / `components.styles` sublayers stay; no third layer is added.

## Why not leave structural modifiers free to set properties

`variant` / `size` / `block` could keep declaring properties directly — only `intent` strictly needs to be var-only for theming. But a uniform "every modifier reassigns vars" rule is what makes composition *provably* conflict-free and mechanically lintable. A half-in model has to be reasoned about case by case; the uniform one does not.

## Consequences

- **The base class is a "var manifold"** — `prop: var(--_x)` for every themeable property. That is the intended shape, not a smell: it is the one place the component's surface is declared.
- **`button` / `stack` / `cluster` are re-authored** to the model; rendered output is unchanged.
- **Splitting roles needs more tokens.** `outline` / `ghost` / `link` need the intent colour separate from the rendered background, so `button` gains `--_fill` / `--_on-fill` (the intent pair) feeding `--_bg` / `--_fg` (what the base paints).
- **A check enforces the model** (`scripts/lint/file-rules/component-css.ts`, dispatched by the project lint runner; see ADR-0014 for the scripts/ layout): a `[data-*]` modifier that declares a real property fails; a root missing `box-sizing` or `margin` fails; a `--t-*` reference that is neither a token nor the component's own slot fails.
- **New components follow the model from the start** — `rules/component-shape.md` documents it.
