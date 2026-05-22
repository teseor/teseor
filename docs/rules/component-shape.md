# Component shape

Every component is one CSS file. It looks like this — every line is intentional.

```css
/* packages/css/src/components/button/button.css */

@layer components.tokens {
  .t-button {
    /* Component-private tokens. Authored as two var() levels;
       the build inlines a third literal floor from tokens.css. ADR-0003. */
    --_h:     var(--t-button-height,  var(--t-row));
    --_bg:    var(--t-button-bg,      var(--t-accent));
    --_fg:    var(--t-button-fg,      var(--t-on-accent));
    --_pad-x: var(--t-button-pad-x,   var(--t-pad-x));
    --_radius:var(--t-button-radius,  var(--t-radius-md));
    --_dur:   var(--t-button-dur,     var(--t-dur-fast));
  }
}

@layer components.styles {
  /* Box-size the component and its own named parts — never `*`. A
     universal descendant reaches consumer content and nested components.
     Enforced by Stylelint (selector-max-universal: 0). */
  .t-button,
  .t-button [data-button-label],
  .t-button [data-button-spinner] {
    box-sizing: border-box;
  }

  .t-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--t-space-2);

    block-size: var(--_h);
    padding-inline: var(--_pad-x);
    padding-block: 0;

    background: var(--_bg);
    color: var(--_fg);
    border: 0;
    border-radius: var(--_radius);

    font: inherit;
    cursor: pointer;
    transition:
      background-color calc(var(--_dur) * var(--t-motion-scale)) var(--t-ease-out),
      transform        calc(var(--_dur) * var(--t-motion-scale)) var(--t-ease-out);
  }

  .t-button:where([data-variant="outline"]) {
    background: transparent;
    box-shadow: inset 0 0 0 1px currentcolor;
    color: var(--_bg);
  }

  .t-button:focus-visible {
    outline: 2px solid var(--t-focus-ring);
    outline-offset: 2px;
  }

  .t-button:is([disabled], [aria-disabled="true"]) {
    cursor: not-allowed;
    opacity: 0.6;
  }
}
```

## Anatomy

1. **Two sublayers.** `components.tokens` declares `--_*` variables on the root selector. `components.styles` writes rule bodies. Splitting them lets themes override token values without specificity wars (see `architecture/layer-order.md`).
2. **Box-sizing — self and named parts.** A component box-sizes itself and its own named parts (`[data-<name>-*]`) — never a universal descendant (`.t-component *`), which reaches consumer content and nested components. A layout primitive (Stack, Cluster) has no internal parts and box-sizes only itself. Stylelint's `selector-max-universal: 0` enforces it on component CSS.
3. **Three-tier `var()` chain at runtime.** Authored as `var(--t-button-x, var(--t-semantic))`; the build inlines the resolved literal from `tokens.css` as the third position, so the shipped CSS is `var(--t-button-x, var(--t-semantic, <literal>))`. Changing a design value is one edit in `tokens.css` (ADR-0003). The literal floor is the failsafe — if both tokens are absent the component still renders correctly.
4. **Logical properties.** `block-size`, `padding-inline`, `padding-block`. No `width`, `height`, `padding-left`, `padding-right`.
5. **Motion via tokens × scale.** Every transition multiplies the duration token by `var(--t-motion-scale)`. Apps that set `--t-motion-scale: 0` get instant transitions.
6. **`:where()` for variant selectors.** Specificity stays at `0,1,0` regardless of how many variants stack. Stylelint's specificity cap (rule 7) lets this stay clean.
7. **`:is([disabled], [aria-disabled="true"])`** — covers both real `<button disabled>` and ARIA-disabled non-button elements.

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

After the build inlines the literal floors, the answer for an atomic component must be **yes** — the third-tier literal in every `var()` chain is the failsafe. `tokens.css` and theme files only improve the result; their absence doesn't break it.

For a composite, the answer is "yes if its declared dependencies (per `specs/<name>.yaml`) are also loaded."

Failure modes the test catches:

- `var(--something)` with no fallback (single-tier) — fails the test, fails Stylelint.
- A reference to another component's `--_x` — fails the test, fails the spec validator.
- A rule outside `@layer` — fails Stylelint.
- A `--t-*` referenced in the component but not declared in `tokens.css` — the build can't resolve a literal, fails the build.

