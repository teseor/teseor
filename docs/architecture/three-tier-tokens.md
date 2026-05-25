# Three-tier tokens

Tokens flow in one direction: raw scale → semantic alias → component-private. Each tier has one job and one writer.

## The three tiers

**Tier 1 — Scale (raw constants).** Lives in `tokens.css` only.

```css
:root {
  --t-neutral-90: oklch(0.15 0 0);
  --t-accent-500: oklch(0.65 0.18 250);
  --t-space-4: 1rem;
  --t-row-2: 2rem;          /* 32px height step */
  --t-radius-md: 0.5rem;
  --t-dur-base: 200ms;
}
```

Numeric or unitless values. No references to other tokens. Generated from a design-token source if we add one later; handwritten for now.

**Tier 2 — Semantic (alias).** Themes write here. Components read here. Apps read here.

```css
:root {
  --t-fg: var(--t-neutral-90);
  --t-accent: var(--t-accent-500);
  --t-pad-x: calc(var(--t-space-4) * var(--t-density));
  --t-row: calc(var(--t-row-2) * var(--t-density));
}
```

Names describe role, not appearance. `--t-accent` not `--t-blue`. Switching a theme means switching these aliases — never the scale.

Spacing shorthands (`--t-pad-x`, `--t-pad-y`, `--t-gap`, `--t-row`) multiply by `--t-density` (default `1`) so a `[data-density="compact"]` or `[data-density="comfortable"]` subtree scales the whole spacing surface in one place. Interactive component roots that need the WCAG 2.5.5 touch-target floor read `--t-touch-min` directly (typically as `block-size: max(var(--t-touch-min), var(--_h))` on the root rule). Flooring `--t-row` in the token layer would inflate the default size (2rem → 2.75rem) for every consumer; component-side flooring keeps the floor where it belongs.

**Tier 3 — Component-private.** Lives inside a component file. Prefix `--_`.

Authored form — what humans type, what lives in the repo:

```css
@layer components.tokens {
  .t-button {
    --_h:     var(--t-button-height, var(--t-row));
    --_bg:    var(--t-button-bg,     var(--t-accent));
    --_pad-x: var(--t-button-pad-x,  var(--t-pad-x));
  }
}
```

Shipped form — what consumers receive in `teseor.css` after the build inlines the literal floor from `tokens.css`:

```css
@layer components.tokens {
  .t-button {
    --_h:     var(--t-button-height, var(--t-row,    2rem));
    --_bg:    var(--t-button-bg,     var(--t-accent, oklch(0.65 0.18 250)));
    --_pad-x: var(--t-button-pad-x,  var(--t-pad-x, 1rem));
  }
}
```

The chain has **three real tiers at runtime**: per-component public token (`--t-button-height`) → semantic alias (`--t-row`) → literal floor (`2rem`). The literal is the failsafe — if neither token resolves (tokens.css absent, theme typo, custom-property wiped by a reset), the component still renders correctly.

The literal is single-sourced in `tokens.css`. A small Teseor PostCSS plugin reads `tokens.css` at build time, resolves each `--t-*` semantic alias to its ultimate literal value, and appends it as the third position of each component's fallback chain. See ADR-0003 for the plugin spec.

### Component-layer interface

`@layer components.tokens` is the only place in a component file that reads global tokens. `@layer components.styles` reads `--_*` slots only. Per-variant defaults (`--_intent-danger-fill`, `--_h-sm`, …) live as named slots in `.tokens`; the modifier rule reassigns `--_fill: var(--_intent-danger-fill)`. The "two real tiers" of indirection — public override slot → semantic alias → literal floor — happens entirely inside `.tokens`; `.styles` sees only the resolved `--_*` slot. The lint rule (`scripts/lint/file-rules/component-css.ts`) rejects `var(--t-*)` references found inside `.styles`. See `rules/component-shape.md` for the full authoring contract and the structural-literal allowlist.

## Who writes what

| Tier | Writers | Readers |
| --- | --- | --- |
| Scale | `tokens.css` only | Tier 2 only |
| Semantic | `tokens.css`, theme files | Components, apps |
| Component-private | The component's own CSS file | Same component only |

A theme that touches element selectors is a bug. A component that reads `--t-neutral-90` directly is a bug. A `--_x` referenced from a sibling component is a bug.

## Build step: PostCSS for loops, breakpoints, and a single token source

CSS is authored by hand. Before publishing, it goes through a focused PostCSS pipeline:

- **`postcss-import`** — bundles `@import` chains into `teseor.css`.
- **`postcss-each`** — `@each` over a list to emit utility classes, size variants, spacing scales without copy-paste.
- **`postcss-custom-media`** — `@custom-media --md (min-width: 48rem);` once in `tokens.css`, used as `@media (--md) { … }` everywhere. Breakpoints stop being magic numbers.
- **`postcss-prefix-selector`** (consumer-controlled) — lets apps re-prefix Teseor classes if they're vendoring.
- One small Teseor-specific plugin (TBD) — handles any token-literal substitution we discover we need (e.g. inlining a spacing scale into a `clamp()` expression where `var()` doesn't reach).

Authoring stays in CSS syntax — no SCSS dialect, no `@use`/`@import` namespacing, no `#{...}` interpolation. Lint with Stylelint, same rules apply.

Why a build step at all (we considered dropping it):

- **Single source for design values.** Changing the default accent color is one edit in `tokens.css`. Components reference `var(--t-accent)` in their authored form; the build inlines the resolved literal as the third-tier failsafe. Authors never type the literal; the build never invents one.
- **Loops.** Utility classes for spacing (`.t-pad-x-0` … `.t-pad-x-8`), size variants, opacity ladders are emitted from a list, not transcribed by hand.
- **Breakpoints as tokens.** `@media (min-width: 48rem)` duplicated across 30 components → `@media (--md)` defined once.

The cost (build step exists, debugging maps source to output) is paid once at the toolchain layer. The win (no value lives in two places) shows up every time a designer says "actually, let's bump the base spacing unit."

## Naming

- Public token: `--t-<component>-<part>` (e.g. `--t-button-height`).
- Semantic alias: `--t-<role>` (e.g. `--t-accent`, `--t-pad-x`).
- Scale: `--t-<family>-<index>` (e.g. `--t-space-4`, `--t-neutral-90`).
- Component-private: `--_<short>` (e.g. `--_h`, `--_bg`).

Class prefix is `t-` (`.t-button`, `.t-input`). Public class names are API — breaking renames need a major bump (see `rules/hard-rules.md` rule 9).

## Token surface

`tokens.css` ships nine categories. Each is a scale; themes and components alias from them.

**Colors.** `oklch` throughout — perceptually uniform, themes get smooth interpolation for free. No hex/rgb fallback layer; `oklch` is Baseline 2024 (Safari 15.4+, Chrome 111+, Firefox 113+). Scale families: `--t-neutral-{0,10,…,100}`, `--t-accent-{50,100,…,900}`, plus role hues (`--t-success-*`, `--t-warning-*`, `--t-danger-*`, `--t-info-*`) at the same `50…900` granularity.

Semantic color aliases (`--t-fg`, `--t-bg`, `--t-accent`, `--t-on-accent`, `--t-border`, `--t-focus-ring`, …) are declared at `:root` for the default mode and re-declared inside `@media (forced-colors: active)` to map to CSS system colors so high-contrast users get a working surface:

```css
:root {
  --t-fg:          oklch(0.15 0 0);
  --t-bg:          oklch(0.98 0 0);
  --t-accent:      oklch(0.65 0.18 250);
  --t-on-accent:   oklch(0.98 0 0);
  --t-border:      oklch(0.85 0 0);
  --t-focus-ring:  oklch(0.55 0.18 250);
}

@media (forced-colors: active) {
  :root {
    --t-fg:         CanvasText;
    --t-bg:         Canvas;
    --t-accent:     ButtonText;
    --t-on-accent:  ButtonFace;
    --t-border:     ButtonBorder;
    --t-focus-ring: Highlight;
  }
}
```

The forced-colors block keeps tokens as the single source of truth across both modes — themes can override either branch independently, components never write forced-colors fallbacks themselves. `postcss-teseor-floor` walks both branches when inlining literals (see ADR-0003 § "Forced-colors resolution").

*Forced-colors floor.* When a consumer loads only a per-component file (`@teseor/css/components/button.css`) without `tokens.css`, the third-position literal that the plugin inlines is the *default-mode* value (e.g. `oklch(...)`). To keep the high-contrast mapping intact in that load case, the plugin also synthesizes a single nested `@media (forced-colors: active)` block at the component root that re-declares every semantic token the file references whose forced-colors literal differs from the default branch:

```css
.t-button {
  --_fill: var(--t-button-bg, var(--t-accent, oklch(65% 0.18 250deg)));
  /* …rest of the component declarations are unchanged */
  @media (forced-colors: active) {
    forced-color-adjust: none;
    --t-accent:     ButtonText;
    --t-on-accent:  ButtonFace;
    --t-focus-ring: Highlight;
    /* …only the semantic tokens this file actually references */
  }
}
```

Custom-property inheritance propagates these values to every `var(--t-*)` reference inside `.t-button`, including its nested rules (`&:where([data-intent="primary"])`, `&:focus-visible`, …). Components don't get per-declaration mirroring — the cascade does the work. A component file that references only scale tokens (`--t-neutral-90`, `--t-space-4`) emits no block, because scale tokens don't change between branches.

The plugin always pairs the override with `forced-color-adjust: none` inside the same block. The two are a unit: without it, the UA layers its native-control rendering (a `ButtonFace` interior with `ButtonText` chrome) on top of the author's colors for form elements, which obliterates the component's appearance even though our token mapping is correct. The opt-out is safe because we've already remapped every relevant token to a system color in the same block — the UA isn't being asked to "trust author colors" but to "trust the explicit system-color mapping the author just wrote."

When `tokens.css` *is* also loaded, the synthesized block and the `:root` forced-colors branch carry the same values, so the result is identical — the block is only load-bearing when the per-component CSS is shipped alone. Consumers who want to override the forced-colors mapping for a specific component target the component class (e.g. `.my-app .t-button { --t-accent: HighlightText; }`) rather than `:root`, since the synthesized declaration is applied directly to the element and beats inherited `:root` values.

*On-X foreground aliases.* Every fill role pairs with a foreground alias for the text or icon that sits on top:

| Fill role | Paired foreground |
| --- | --- |
| `--t-fg` (text on default surface) | `--t-on-fg` (when text needs an inverted color, e.g. on a highlight) |
| `--t-bg` (default surface) | `--t-on-bg` (same as `--t-fg` in default mode; separate for symmetry) |
| `--t-surface` (raised surface, cards) | `--t-on-surface` |
| `--t-surface-muted` (inset / de-emphasized — code wells) | `--t-on-surface-muted` |
| `--t-surface-inverse` (light-on-dark — tooltips, dark menus) | `--t-on-surface-inverse` |
| `--t-accent` | `--t-on-accent` |
| `--t-danger` | `--t-on-danger` |
| `--t-success` | `--t-on-success` |
| `--t-warning` | `--t-on-warning` |
| `--t-info` | `--t-on-info` |

Themes MUST keep contrast ≥ 4.5:1 between each fill role and its paired `--t-on-<role>` (WCAG 2.2 AA for normal text). The visual-tests + axe gate enforces this per theme on every example. Components reference `--t-on-<role>` directly whenever they render text/icons on a colored fill; they never compute the contrast themselves.

**Spacing.** 4px-based modular ladder, nine steps:

| Token | rem | px |
| --- | --- | --- |
| `--t-space-0` | 0 | 0 |
| `--t-space-1` | 0.25rem | 4 |
| `--t-space-2` | 0.5rem | 8 |
| `--t-space-3` | 0.75rem | 12 |
| `--t-space-4` | 1rem | 16 |
| `--t-space-5` | 1.5rem | 24 |
| `--t-space-6` | 2rem | 32 |
| `--t-space-7` | 3rem | 48 |
| `--t-space-8` | 4rem | 64 |

Dense steps at the small end catch tight UI; doubling above `--t-space-4` keeps the ladder finite. Modular utilities (`.t-pad-x-0` … `.t-pad-x-8`) emit from this list via `postcss-each`.

**Typography.** Ratio 1.125 (major second), seven steps, anchored at `--t-text-base = 1rem`:

| Token | rem |
| --- | --- |
| `--t-text-xs` | 0.79rem |
| `--t-text-sm` | 0.89rem |
| `--t-text-base` | 1rem |
| `--t-text-lg` | 1.125rem |
| `--t-text-xl` | 1.27rem |
| `--t-text-2xl` | 1.42rem |
| `--t-text-3xl` | 1.6rem |

Tight ratio favors data-dense UIs (dashboards, forms) over editorial. Line-height scale parallel: `--t-leading-tight` (1.2), `--t-leading-normal` (1.5), `--t-leading-loose` (1.75). Font families: `--t-font-sans`, `--t-font-mono` (themeable; aliased to OS stacks by default).

**Breakpoints.** Defined once via `postcss-custom-media`, mobile-first (base = smallest, suffixes go up):

```css
@custom-media --md (min-width: 48rem);  /* 768px  */
@custom-media --lg (min-width: 64rem);  /* 1024px */
@custom-media --xl (min-width: 80rem);  /* 1280px */
@custom-media --2xl (min-width: 96rem); /* 1536px */
```

No `--sm` — the base styles are the small viewport. Components write `@media (--md) { … }`, never raw widths.

**Borders.** `--t-border-0` (0), `--t-border-thin` (1px), `--t-border-medium` (2px), `--t-border-thick` (4px). Border-style and color come from semantic aliases (`--t-border`, `--t-border-strong`).

**Radius.** `--t-radius-none` (0), `--t-radius-sm` (0.25rem), `--t-radius-md` (0.5rem), `--t-radius-lg` (0.75rem), `--t-radius-xl` (1rem), `--t-radius-full` (9999px).

**Shadows.** `--t-shadow-none`, `--t-shadow-sm`, `--t-shadow-md`, `--t-shadow-lg`, `--t-shadow-xl`. Themeable; defaults use `oklch` w/ alpha so they reskin with the color theme.

**Motion.** Durations and easings, gated by `--t-motion-scale` for `prefers-reduced-motion` (see `rules/component-shape.md` motion section).

| Token | value |
| --- | --- |
| `--t-dur-instant` | 0ms |
| `--t-dur-fast` | 120ms |
| `--t-dur-base` | 200ms |
| `--t-dur-slow` | 320ms |
| `--t-dur-glacial` | 500ms |
| `--t-dur-enter-fast` | `var(--t-dur-fast)` (120ms) |
| `--t-dur-enter-base` | `var(--t-dur-base)` (200ms) |
| `--t-dur-enter-slow` | `var(--t-dur-slow)` (320ms) |
| `--t-dur-exit-fast` | `calc(var(--t-dur-fast) * 0.65)` (~78ms) |
| `--t-dur-exit-base` | `calc(var(--t-dur-base) * 0.65)` (~130ms) |
| `--t-dur-exit-slow` | `calc(var(--t-dur-slow) * 0.65)` (~208ms) |
| `--t-ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--t-ease-out` | `cubic-bezier(0, 0, 0.2, 1)` |
| `--t-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` |
| `--t-ease-spring` | `cubic-bezier(0.5, 1.5, 0.7, 1)` |
| `--t-ease-linear` | `linear` |
| `--t-motion-scale` | `1` (or `0` in reduced-motion) |

**Z-index.** `--t-z-base` (0), `--t-z-dropdown` (10), `--t-z-sticky` (20), `--t-z-fixed` (30), `--t-z-overlay` (40), `--t-z-modal` (50), `--t-z-popover` (60), `--t-z-toast` (70), `--t-z-tooltip` (80). No raw integers in component CSS.

## Sources

- `architecture/layer-order.md` (the `tokens.scale` and `tokens.semantic` layers this populates)
- `rules/hard-rules.md` rules 1–3 (token tiers as policy)
- `ADR/0003-postcss-build-step.md` (the literal-floor inlining that resolves Tier 3)
- `rules/motion.md` § "Token surface" (the motion-token detail)
