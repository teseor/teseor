# Themes

A theme is a CSS file that overrides Tier 2 semantic tokens. Nothing else. No class selectors, no element selectors, no attribute selectors, no `!important`. A theme that touches anything outside semantic tokens is a bug — the `themes/` lint rule under § "Hard rule" is designed to catch it.

## Status today

### Implemented today

- Default theme values live in `packages/css/src/tokens.css`
- The semantic-token-only theme model is part of the architecture contract

### Not implemented yet

- A top-level `themes/` directory in this repo
- Theme-file metadata parsing against shipped theme files
- The dedicated lint enforcement for `themes/*.css`

## File shape

```css
/*! teseor-theme
name: Editorial
description: High-contrast serif-forward theme for content-heavy sites
author: name <optional@email>
tags: [serif, editorial, high-contrast]
preview: showcase-notion
*/

[data-theme="editorial"] {
  --t-fg: oklch(0.15 0.02 60);
  --t-bg: oklch(0.98 0.005 80);
  --t-accent: oklch(0.45 0.18 25);
  --t-font-sans: "Charter", "Iowan Old Style", Georgia, serif;
  --t-radius-md: 0.125rem;
  /* … only --t-* declarations … */
}

[data-theme="editorial"][data-mode="dark"] {
  --t-fg: oklch(0.95 0.01 80);
  --t-bg: oklch(0.18 0.02 60);
  /* …overrides for dark mode… */
}

@media (prefers-color-scheme: dark) {
  [data-theme="editorial"]:not([data-mode="light"]) {
    --t-fg: oklch(0.95 0.01 80);
    --t-bg: oklch(0.18 0.02 60);
    /* …same dark values, applied automatically when no explicit mode is set… */
  }
}
```

The CSS comment block at the top is **theme metadata** — required fields `name` and `description`; optional `author`, `tags`, `preview` (the showcase slug used to render the theme on `teseor.dev/themes`). `gen-docs` finds the sentinel block (`/*! teseor-theme … */`) and parses its body as YAML using the same `js-yaml` instance used for `specs/*.yaml`. Theme files without the sentinel are still valid CSS but won't appear in the gallery; the lint rule warns when a `themes/*.css` file omits it.

## Switching mechanism

Two attributes on `<html>` (or `<body>`):

- **`data-theme`** — the theme slug (`default`, `editorial`, …). Required.
- **`data-mode`** — `light`, `dark`, or absent. When absent, `prefers-color-scheme` decides.

```html
<html data-theme="editorial">          <!-- auto mode -->
<html data-theme="editorial" data-mode="dark">   <!-- forced dark -->
```

JS toggles attributes; CSS does the rest. No CSS re-fetch, no JS framework dependency, SSR-friendly (server reads a cookie, writes the right attributes into the initial HTML).

The default theme applies when `data-theme` is absent or unrecognized — its rules live under `[data-theme]:not([data-theme="editorial"]):not([data-theme="…"])` OR (more cleanly) the default is written at `:root` and other themes override.

```css
/* default theme — tokens.css */
:root {
  --t-fg: oklch(0.15 0 0);
  --t-bg: oklch(0.98 0 0);
  --t-accent: oklch(0.65 0.18 250);
  /* … */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-mode="light"]) {
    --t-fg: oklch(0.95 0 0);
    --t-bg: oklch(0.15 0 0);
  }
}
```

So `tokens.css` ships the default theme inline. Additional themes (`themes/editorial.css`, `themes/<custom>.css`) are separate files consumers opt into.

## v1.0 minimum: two themes

`default` (sans-serif, neutral, dense) + `editorial` (serif, high-contrast, generous whitespace). The pair is maximally different — proves the theming claim. Themes that look like each other don't prove anything.

We rejected bootstrap/material/terminal style "cosplay themes" for the v1.0 pair. They prove "Teseor can look like X" but not "Teseor can look like *anything*." Cosplay themes are welcome as community submissions post-v1.0, but they're not the right shape for the headline pair.

## Hard rule

A theme file may contain **only** `--t-*` custom-property declarations: no class selectors, no element selectors, no attribute selectors beyond `[data-theme]`/`[data-mode]`, no `!important`, no `@import`. This is what stops the `themes/` directory from becoming a CSS escape hatch.

The rule is **not yet lint-enforced**. Themes land at v1.0 (§ "v1.0 minimum: two themes"), and the `themes/` directory does not exist before then — `.stylelintrc.cjs` carries a component-scoped override today but nothing for `themes/`. When the directory lands, a Stylelint override scoped to `themes/*.css` will enforce the restriction; until then it is a review convention. See `process/ci-gates.md` for the intended wiring.

## Consumer overrides

Apps that need to tweak Teseor for their brand write a single `theme.css` in their own repo, following the same token-only rule as shipped themes. The shared Stylelint config (`@teseor/stylelint-config`) is planned to extend the same restriction to consumer files matching `**/theme.css`.

```ts
// app entry
import "@teseor/css";        // base + components + utilities
import "./theme.css";        // consumer token overrides (last wins)
```

```css
/* app/theme.css — token overrides only */
:root {
  --t-accent:     oklch(0.55 0.22 280);
  --t-radius-md:  0.75rem;
  --t-font-sans:  "Inter", system-ui, sans-serif;
}
```

Showcase apps follow this pattern — see `docs/roadmap.md` § "v0.4 — Surfaces" for the "only Teseor inside" rule and the `showcase-purity` CI gate that enforces it.

## Scoped overrides

Both mechanisms above are document-wide because they sit on `<html>`. Neither has to. `--t-*` tokens cascade like any custom property, and the `data-theme` / `data-mode` selectors are attribute matchers — so both work on any element. Set them on a subtree root and only that subtree is re-themed.

Two forms, smallest first:

```css
/* One token, one region — a promo band with a warmer accent */
.promo {
  --t-accent: oklch(0.62 0.2 30);
}
```

```html
<!-- A whole named theme, scoped to one region -->
<main data-theme="editorial">
  <!-- editorial tokens apply here -->
  <aside data-theme="default" data-mode="dark">
    <!-- a dark default island, nested inside the editorial region -->
  </aside>
</main>
```

Because tokens cascade, an inner scope overrides an outer one, and a sibling outside the scope is untouched. The token-only rule still holds: a scoped override reassigns `--t-*` values and nothing else.

Scoped overrides are a consumer escape hatch, not a packaged surface. The `themes/` and `**/theme.css` lint guard (§ "Hard rule") only ever inspects theme *files* — it never sees a `--t-*` override buried in component CSS or an inline style. Keep them rare: if the same override recurs it wants to be a real theme, not copied into ten subtrees.

## Custom themes (community)

Post-v1.0, consumers and the community submit themes as PRs to `themes/<slug>.css`. The CSS comment metadata + the file-structure lint rule mean review is shallow: check the slug, check the metadata, check it lints. The theme runs through visual-tests against every component automatically.
