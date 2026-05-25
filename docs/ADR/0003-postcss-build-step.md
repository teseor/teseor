# ADR-0003 — PostCSS build step for unified scales

- **Status:** Accepted.
- **Deciders:** repo owner (letanure).

## Context

Three-tier tokens in plain CSS would express the third tier as a hardcoded literal:

```css
var(--t-button-bg, var(--t-accent, oklch(0.65 0.18 250)))
```

This solves the "what if tokens.css fails to load" failure mode at the cost of duplicating literals across every component. Changing the default accent color would mean grepping every component file for `oklch(0.65 0.18 250)` and updating each one — exactly the kind of multi-file edit a design system is supposed to make unnecessary.

Beyond fallbacks, two adjacent problems also want a build step:

- **Loops.** Utility classes (`.t-pad-x-0` through `.t-pad-x-8`), size variants per component, opacity ladders — all transcribed by hand in plain CSS.
- **Breakpoints.** `@media (min-width: 48rem)` repeated across every responsive component. CSS custom properties don't work inside `@media` queries, so the value has to be inlined.

## Decision

Adopt a PostCSS build pipeline. Author components in CSS syntax (no SCSS dialect, no `#{...}` interpolation), but pre-process before publishing.

Plugins:

| Plugin | Job |
| --- | --- |
| `postcss-import` | Bundle `@import` chains into `teseor.css`; bundle a composite's deps |
| `postcss-each` | `@each $i in 0, 1, 2, 3 { … }` loops over lists |
| `postcss-custom-media` | `@custom-media --md (min-width: 48rem);` once in `tokens.css`, `@media (--md) { … }` everywhere |
| `postcss-prefix-selector` | Consumer-controlled; lets apps re-prefix Teseor classes when vendoring |
| `postcss-teseor-floor` (custom) | Reads `tokens.css`, resolves every `--t-*` semantic alias to its ultimate literal value, and appends that literal as the third fallback position of each component's `var()` chain |

CSS authoring uses a two-level `var()` chain. The build appends the literal floor:

```css
/* AUTHORED — what humans type, what lives in the repo */
--_bg: var(--t-button-bg, var(--t-accent));

/* SHIPPED — what consumers receive in teseor.css */
--_bg: var(--t-button-bg, var(--t-accent, oklch(0.65 0.18 250)));
```

The plugin reads `tokens.css`, walks each `--t-*` chain to its terminal literal, then walks every component's `var()` references and rewrites them with the literal appended. Single source for the value (`tokens.css`); three real tiers at runtime in the shipped CSS; failsafe preserved if both tokens are absent.

## Forced-colors resolution

`tokens.css` declares semantic color aliases twice: once at `:root` (default mode) and once inside `@media (forced-colors: active)` mapping to CSS system colors. See `architecture/three-tier-tokens.md` § "Colors" for the exact block.

The plugin builds two token maps from `tokens.css` — the default `:root` map and the forced-colors-overlaid map. It then collects every `--t-*` name a component file references and, for each one that resolves to a different literal in the two maps, emits a single nested `@media (forced-colors: active)` block at the component root that re-declares the *upstream semantic token*:

```css
/* AUTHORED */
.t-button {
  --_fill: var(--t-button-bg, var(--t-accent));
  /* …other declarations using --t-accent, --t-focus-ring, --t-surface… */
}

/* SHIPPED */
.t-button {
  --_fill: var(--t-button-bg, var(--t-accent, oklch(65% 0.18 250deg)));
  @media (forced-colors: active) {
    --t-accent: ButtonText;
    --t-focus-ring: Highlight;
    --t-surface: Canvas;
    /* …only the semantic tokens this component actually references */
  }
}
```

Custom-property inheritance propagates those system-color values to every `var()` reference inside the component subtree. The default-mode declarations keep their oklch literal floor; the third-position fallback never fires in forced-colors because `--t-accent` is now defined on the component root. One block per component covers every nested rule, every variant, every state — no per-declaration mirroring.

Components never hand-write `@media (forced-colors: active)` blocks for color overrides — the plugin synthesizes them from the token contract. Components may still hand-write forced-colors blocks for *non-color* concerns (e.g. `outline-width`, `forced-color-adjust: none`) where the rule isn't expressible through token literals.

## Why not SCSS

- SCSS is a whole language with its own syntax (`#{...}`, `@use as`, `@mixin`, `%placeholder`). Switching from CSS syntax raises the cognitive cost for contributors and AI agents.
- The features we actually want (loops, custom-media, import bundling, substitution) are each ~150-line PostCSS plugins. SCSS bundles a lot more than we'll use.
- Stylelint plays cleanly with PostCSS-extended CSS; SCSS needs `postcss-scss` or `stylelint-scss` to lint properly.

## Why not "drop the third tier entirely, no build step"

It works mechanically: `var(--t-button-bg, var(--t-accent))` with no literal. But it deletes the failsafe — if `--t-accent` is undefined (tokens.css absent, theme typo, scoped reset wiping inherited custom properties), the component renders broken. It also doesn't solve loops or breakpoints, which need a build step regardless. Since we're paying for the build, the build can also append the literal floor.

## Consequences

- **Component CSS files are author-time files.** Consumers receive the compiled `teseor.css`. Component sources stay readable in the repo for review and diffing.
- **`tokens.css` ships as a standalone entry-point.** Published at `@teseor/css/tokens.css` so consumers can compose third-party themes or use tokens without components. The full `teseor.css` bundle also includes the same tokens inlined.
- **Dual entry-points: full bundle + per-component.** `import "@teseor/css"` loads the whole `teseor.css`. `import "@teseor/css/button"` loads `button.css` alone. The per-component shipped files each carry their inlined literal floor and render correctly without the full bundle. Bundlers tree-shake by default.
- **A shipped component file is loadable alone.** The literal floor is inlined per component; a single compiled component CSS renders correctly even without `tokens.css` or theme files present. The acid test (`rules/component-shape.md`) runs against the shipped form.
- **An authored component file is not loadable alone.** Authors reference `var(--t-accent)` without a literal; the literal is added by the build. This is fine — authored files are never shipped directly.
- **Build dependency.** `pnpm build:css` becomes the publishing step. CI runs it; consumers don't.
- **Stylelint config stays the same.** PostCSS plugins use at-rules (`@each`, `@custom-media`) — Stylelint understands them and the existing rule set still applies.
- **Sourcemaps.** Build emits sourcemaps next to each compiled CSS file. Both the `.css` and `.css.map` files ship in the npm tarball so devtools point at the authored source. The `dist/` directory is `.gitignore`d — only the npm artifact carries the compiled output.
- **No `dist/` in git, no `build:css-drift` gate.** Without committed dist there's nothing to diff against. The `build:css` job alone catches the real bugs: a `--t-*` referenced but not declared in `tokens.css` fails the build because `postcss-teseor-floor` can't resolve a literal.
- **`postcss-teseor-floor` is in-house code we maintain.** ~150 lines. Test surface: read a fixture `tokens.css`, walk var-chains, assert the inlined literal matches. If `tokens.css` ever moves to a generated form (e.g. from a Style Dictionary source), the plugin keeps working — it consumes the resolved CSS, not the source.
