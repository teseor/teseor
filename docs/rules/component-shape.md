# Component shape

Every component is one CSS file. `components.tokens` is the single interface
boundary — every global-token reference lives here. `components.styles` reads
`--_*` slots only. Trimmed example:

```css
/* packages/css/src/components/button/button.css — trimmed */

@layer components.tokens {
  .t-button {
    /* The complete mutable surface. A public slot falls back to a semantic
       token; the build inlines a literal floor as the third tier. */
    --_h:       var(--t-button-height, var(--t-row-3));
    --_fill:    var(--t-button-bg, var(--t-accent));
    --_on-fill: var(--t-button-fg, var(--t-on-accent));
    --_bg:      var(--_fill);
    --_fg:      var(--_on-fill);

    /* Global slots — global tokens read here, not in .styles. */
    --_motion-scale: var(--t-motion-scale);
    --_focus-ring:   var(--t-focus-ring);

    /* Per-intent slots — the [data-intent="X"] modifier reads from these. */
    --_intent-danger-fill:    var(--t-danger);
    --_intent-danger-on-fill: var(--t-on-danger);
  }
}

@layer components.styles {
  .t-button {
    box-sizing: border-box;
    margin: 0;                       /* owns its box model — never the reset */
    display: inline-flex;
    block-size: var(--_h);
    background: var(--_bg);          /* the base reads --_* vars */
    color: var(--_fg);

    & [data-button-label] {          /* box-size own named parts, never `& *` */
      box-sizing: border-box;
    }

    &:where([data-intent="danger"]) {
      --_fill: var(--_intent-danger-fill);     /* modifier reassigns from .tokens slots */
      --_on-fill: var(--_intent-danger-on-fill);
    }

    &:where(:hover):not([disabled], [aria-disabled="true"]) {
      --_bg: color-mix(in oklch, var(--_fill) 92%, black);
    }

    &:focus-visible {
      outline: 2px solid var(--_focus-ring);   /* reads slot, not the global token */
      outline-offset: 2px;
    }
  }
}
```

## The model

1. **`components.tokens` declares every mutable value** as a `--_*` custom property on the root, AND is the only layer that reads global tokens (`var(--t-*)`). If a value varies — across variants, intents, sizes, states, or themes — it is a `--_*` slot here. The block is the component's manifest of every external token it depends on.
2. **The base class and descendant selectors declare the properties**, each reading a `--_*` var (`background: var(--_bg)`). The base is a "var manifold" — that is the intended shape, not a smell.
3. **`[data-*]` modifiers reassign vars only.** `&:where([data-intent="danger"])` is a block of `--_*` reassignments — never a real property, and never a direct `var(--t-*)` read. Per-variant defaults live as `--_intent-danger-fill` slots in `.tokens`; the modifier reads `--_fill: var(--_intent-danger-fill)`. Because modifiers only move tokens, stacking `variant + intent + size` is conflict-free: `:where()` flattens specificity, source order settles "last wins" per token, non-colliding tokens never interact.
4. **State rules** (`:hover`, `:focus-visible`, `[disabled]`, …) reassign vars for what they change. Genuinely-fixed structure (the focus outline) may be declared directly — but its values still read `--_*` slots, never `var(--t-*)`.

`scripts/lint/file-rules/component-css.ts` enforces points 1–4.

## Conventions

1. **Two sublayers, strict boundary.** `components.tokens` declares every `--_*` slot and is the *only* layer that reads global tokens (`var(--t-*)`). `components.styles` reads `--_*` slots only, plus the structural literals listed below. Splitting them lets themes override token values without specificity wars (`architecture/layer-order.md`).
2. **A component owns its box model.** It declares its own `box-sizing` and `margin` on the root — never leaning on `reset.css`. A `<button>` carries a UA margin; the component zeroes it. The acid test is "renders correctly with only its own file loaded."
3. **Box-sizing — self and named parts.** A component box-sizes itself and its own named parts (`[data-<name>-*]`) — never a universal descendant (`& *`), which reaches consumer content and nested components. A layout primitive (Stack, Cluster) has no internal parts and box-sizes only itself. Stylelint's `selector-max-universal: 0` enforces it.
4. **Token references — real token or own slot, inside `.tokens` only.** Every `--t-*` reference is either declared in `tokens.css` or matches `--t-{component}-*` (the public override slot), AND it lives inside `@layer components.tokens`. A stray `var(--t-row-2)` in a `:where([data-size="sm"])` modifier and a typo'd `--t-buton-bg` are both caught.
5. **Three-tier `var()` chain at runtime.** A public token reads `var(--t-button-x, var(--t-semantic))`; the build inlines the resolved literal from `tokens.css` as the third position (ADR-0003), so the shipped CSS is `var(--t-button-x, var(--t-semantic, <literal>))`. The literal floor is the failsafe — if both tokens are absent the component still renders.
6. **Logical properties.** `block-size`, `padding-inline`, `padding-block`. No `width`, `height`, `padding-left`, `padding-right`.
7. **Motion via tokens × scale.** Every transition multiplies its duration by `var(--_motion-scale)`, a `--_*` slot fed from `var(--t-motion-scale)` in `.tokens`. Apps that set `--t-motion-scale: 0` get instant transitions; the indirection keeps `.styles` free of direct global-token reads.
8. **`:where()` for modifier selectors** keeps specificity at `0,1,0` however many modifiers stack. **`:is([disabled], [aria-disabled="true"])`** covers both real `<button disabled>` and ARIA-disabled non-button elements.

## Structural literals

`components.styles` allows a small set of literal values without aliasing through a `--_*` slot:

| Literal | Use |
| --- | --- |
| `0` (any unit, including unitless) | Zero margin/padding/border/opacity reset. |
| `1` (dimensionless) | Opacity reset, `line-height: 1`. |
| `1em` | Icon sizing intrinsic to the local font-size. |
| `50%` | Centering transforms, circular border-radius. |
| `100%` | Full-extent dimensions. |

CSS keyword values (`flex`, `inline-flex`, `currentColor`, `transparent`, `auto`, `none`, `inherit`, `revert`, …) pass through implicitly — they are property vocabulary, not magic numbers.

Anything else dimensional or numeric (e.g. `2px`, `0.6`, `0.875rem`, `20rem`) must alias through a `--_*` slot declared in `components.tokens` — even when the value is hard-coded and the slot has no `var(--t-*)` fallback. The slot is the named role; the literal is whatever happens to back it.

## What's not in the component

- No JavaScript. Logic that needs JS lives in `@teseor/primitives` (post-v0.3) and is consumed by every wrapper.
- No bare `@import` of other component files in the body. A composite (`Modal`) declares its dependencies in `specs/modal.yaml` under `dependencies: [button, backdrop]`, and the build resolves `@import` lines at the top of the file. See "Cross-component composition" below.
- No `theme.css`-style overrides inside a component file. Themes live in `themes/<name>.css` and only touch tokens.
- No bare top-level element selectors (`button`, `input`). The class is the contract; element selectors may appear only as descendants of a class.

## Cross-component composition

When component A (Modal) uses component B (Button), there is **no CSS-level rule reuse** — no partials, no mixins, no `@extend`. Reuse happens at three other levels.

**1. DOM composition (the default).** A Modal renders a Button element. The DOM holds both classes:

```html
<div class="t-modal">
  <button class="t-button" data-variant="ghost" data-shape="icon">×</button>
</div>
```

Modal's CSS styles `.t-modal`. Button's CSS styles `.t-button`. Neither file knows about the other. The visual result emerges from the cascade of both files being loaded.

**2. Shared tokens (cross-component adjustment).** When Modal wants its close button slightly different, it overrides Button's *public tokens* on its scope — not Button's rules:

```css
.t-modal__close {
  --t-button-height: var(--t-space-5); /* 1.5rem, tighter than default --t-row */
  --t-button-pad-x:  var(--t-space-2);
}
```

No rule redeclaration. Button's CSS reacts because it already reads `var(--t-button-height, …)` and `var(--t-button-pad-x, …)`. Modal sets the *public* token surface that Button publishes; Button does the rest. This is the only mechanism for cross-component visual adjustment.

**3. Build-time `@import` (composites only).** A composite's CSS file declares its dependencies via `@import` lines at the very top of the file:

```css
/* packages/css/src/components/modal/modal.css */
@import "../button/button.css";
@import "../backdrop/backdrop.css";

@layer components.tokens {
  .t-modal { … }
}
```

`postcss-import` resolves these at build time. The published `dist/modal.css` contains Button's rules + Backdrop's rules + Modal's rules. The published `dist/button.css` contains only Button's rules. A consumer importing both `@teseor/css/modal` and `@teseor/css/button` gets deduped output — `postcss-import` recognizes the second import as a no-op.

**The `dependencies:` spec field drives four things:**

| Consumer | What it does |
| --- | --- |
| `gen-react`, `gen-vue`, … | Generated `Modal.tsx` imports `Button`; renders `<Button variant="ghost" iconLeft="x" />` in the close slot |
| `postcss-import` | Walks the `@import` chain in build order; inlines into Modal's published file |
| `validate-spec.ts` | Rejects dependency cycles; rejects `@import` statements whose target isn't listed in `dependencies:` |
| `gen-docs` | Modal's docs page shows "Composed of: Button" with a link |

**Anti-patterns (linted or rejected):**

- ✗ Redeclaring button rules inside Modal's CSS — duplication, drift, theme breakage.
- ✗ SCSS-style `@mixin button-base { … }` — we have no mixins.
- ✗ `@import` anywhere except the very top of the file — Stylelint flags it.
- ✗ `@import` of a file not declared in `spec.dependencies` — `validate-spec.ts` fails the build.
- ✗ Styling a descendant via `.t-modal .t-button { … }` — that's Modal overriding Button's rules, breaks theming, leaks specificity. Use tokens on `.t-modal` scope instead.

The mechanism is documented at v0.1 but unused until v0.4 when the first composite lands. The rule applies retroactively: any component whose spec declares `kind: composite` must follow this contract.

### Bounding the cascade

Transitive imports inline transitively — Modal imports Button + Backdrop, Backdrop imports nothing, Button imports nothing, so `dist/modal.css` contains all three. `postcss-import` dedupes identical paths.

Two things keep this from exploding:

- **No tree-shaking inside a component file.** A Button is one indivisible unit with all its variants, intents, and sizes — we don't split into `button-solid.css` / `button-outline.css` / etc. Each variant is a `:where([data-variant="X"])` clause that costs 50–200 bytes gz; the whole Button file lives well under the per-component budget (per-component budget: ≤4KB min / 1.5KB gz; `process/ci-gates.md` § "bundle"). Pulling in "all of Button" via `@import` is cheap.
- **Per-component bundle budget is the cascade governor.** `size-limit` enforces ≤4KB min / 1.5KB gz on every `dist/<name>.css`. A composite that grows past the budget after inlining fails CI. Author has two fixes:
  1. Trim deps or simplify Modal's own rules.
  2. Redirect the per-component path to the full bundle — set `@teseor/css/modal` in the package `exports` to re-export `@teseor/css` (the full `teseor.css`). Consumers requesting per-component get the bundle with a docs note: "Modal is too large to ship standalone; use the full bundle." Loud and opinionated; bounds the cost.

We do NOT cap dependency depth. A composite may depend on other composites. The budget gate catches over-large closures more honestly than a structural rule would.

## The acid test

> Would the **shipped** form of this file render correctly with nothing else loaded?

After the build inlines the literal floors, the answer for an atomic component must be **yes** — the third-tier literal in every `var()` chain is the failsafe, and the component declares its own box model. `tokens.css`, `reset.css`, and theme files only improve the result; their absence doesn't break it.

For a composite, the answer is "yes if its declared dependencies (per `specs/<name>.yaml`) are also loaded."

Failure modes the test catches:

- `var(--something)` with no fallback (single-tier) — fails the test, fails Stylelint.
- A `--t-*` referenced in the component but not declared in `tokens.css` and not the component's own `--t-{component}-*` slot — fails `check-component-css.ts`.
- A `var(--t-*)` reference inside `@layer components.styles` — fails `check-component-css.ts`.
- A `[data-*]` modifier that declares a real property — fails `check-component-css.ts`.
- A root missing `box-sizing` or `margin` — leans on the reset; fails `check-component-css.ts`.
- A reference to another component's `--_x` — fails the test, fails the spec validator.
- A rule outside `@layer` — fails Stylelint.
