# `@layer` order

One canonical CSS cascade order, declared once at the top of `teseor.css`. Sublayered — not flat.

```css
@layer reset, tokens.scale, tokens.semantic, base, primitives, components.tokens, components.styles, utilities, themes;
```

Declared early enough that any layered rule, anywhere, lands in its slot. Later declarations of the same layer name are merged, not duplicated. Order in the declaration is order in the cascade.

## What each layer does

| Layer | Writers | Reads | Purpose |
| --- | --- | --- | --- |
| `reset` | one `reset.css` | nothing | normalize browser defaults |
| `tokens.scale` | `tokens.css` | nothing | raw numeric constants (Tier 1) |
| `tokens.semantic` | `tokens.css`, themes | scale | role-named aliases (Tier 2) |
| `base` | one `base.css` | semantic | element defaults: `body`, headings, links |
| `primitives` | `@teseor/primitives` (v0.4) | semantic | focus-ring, portal, focus-trap — no semantic intent |
| `components.tokens` | each component file | semantic | declares `--_x` on the component root |
| `components.styles` | each component file | `--_x` only | actual rule bodies (selectors → properties) |
| `utilities` | `packages/css/src/utilities/*.css` | semantic | one-property classes — spacing, display, visibility, text, animation (see `rules/utilities.md`). Layout primitives (Stack/Cluster) are **not** here — they're components. |
| `themes` | each theme file | nothing | overrides semantic aliases — never element selectors |

## Why the sublayers

**`tokens.scale` vs `tokens.semantic`** — themes need to override aliases without touching the scale. Splitting the slot prevents a theme from accidentally redefining `--t-neutral-90`.

**`themes` last** — semantic overrides win over component declarations. Apps never need `!important` to swap themes.

## Rules

- Every component declaration goes inside a `@layer` block. No bare declarations.
- `!important` is forbidden outside `@layer themes` and the documented `data-hidden-md` / `data-show-md` visibility primitives.
- A `@layer` block in a component file uses the right sublayer (`components.tokens` for `--_x`, `components.styles` for rules).
- The cascade is declared once in `teseor.css`. Component files don't redeclare it.

## Why no `animations` layer

`@keyframes` are identified by *name* in a global namespace, not by selectors entering the cascade — a dedicated layer wouldn't change their resolution. Per-component transitions live in `components.styles` (motion belongs with the rule that triggers it). `prefers-reduced-motion` is handled at the token tier (`--t-motion-scale: 0` in `tokens.semantic` via `@media`), not via a separate layer. Shared keyframes sit in a `motion.css` file with bare `@keyframes` declarations — no `@layer` wrapper because none is needed.
