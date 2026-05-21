# `@teseor/css`

CSS source of truth for Teseor. Tokens, reset, base elements, and a small
spacing + display utility set, distributed as four entry points.

## Install

```bash
npm install @teseor/css
```

## Entry points

| Import | What it ships |
| --- | --- |
| `@teseor/css` | Full bundle: reset + tokens + base + utilities, in layer order. |
| `@teseor/css/tokens.css` | Tokens only (`--t-*` scale + semantic aliases). |
| `@teseor/css/utilities.css` | Utility classes only. |
| `@teseor/css/tailwind.css` | Tailwind v4 `@theme` bridge mapping `--t-*` to `--color-*` / `--spacing-*` / `--radius-*`. |

## Utility classes

All utilities are prefixed `t-` to avoid collisions when vendored alongside
other CSS frameworks. Spacing utilities pull their value from the
`--t-space-{0..8}` scale (see `src/tokens.css`).

### Spacing

| Class | Property |
| --- | --- |
| `.t-p-{0..8}` | `padding` |
| `.t-px-{0..8}` | `padding-inline` |
| `.t-py-{0..8}` | `padding-block` |
| `.t-m-{0..8}` | `margin` |
| `.t-mx-{0..8}` | `margin-inline` |
| `.t-my-{0..8}` | `margin-block` |
| `.t-gap-{0..8}` | `gap` |

Directional logical pairs (`padding-inline-start` etc.) are applied
per-rule inside component CSS rather than shipped as utility classes.

### Display

| Class | `display` value |
| --- | --- |
| `.t-block` | `block` |
| `.t-inline` | `inline` |
| `.t-inline-block` | `inline-block` |
| `.t-flex` | `flex` |
| `.t-inline-flex` | `inline-flex` |
| `.t-grid` | `grid` |
| `.t-inline-grid` | `inline-grid` |
| `.t-contents` | `contents` |
| `.t-hidden` | `none` |

## Build

The published `dist/` is generated from `src/` by `packages/css/build.mjs`,
a PostCSS pipeline (`postcss-import` + `postcss-each` + `postcss-custom-media`).
Run locally:

```bash
pnpm --filter @teseor/css build
```

Output is deterministic across runs.
