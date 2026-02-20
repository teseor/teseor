<p align="center">
  <strong>@teseor/css</strong>
  <br>
  CSS-first UI library. 62 components, design tokens, 8px grid rhythm.
  <br>
  Framework-agnostic. Zero JavaScript.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@teseor/css"><img src="https://img.shields.io/npm/v/@teseor/css" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@teseor/css"><img src="https://img.shields.io/npm/dm/@teseor/css" alt="npm downloads"></a>
  <a href="https://github.com/teseor/teseor/blob/main/LICENSE"><img src="https://img.shields.io/github/license/teseor/teseor" alt="license"></a>
  <a href="https://github.com/teseor/teseor/actions/workflows/visual-tests.yml"><img src="https://img.shields.io/github/actions/workflow/status/teseor/teseor/visual-tests.yml?branch=main&label=tests" alt="tests"></a>
</p>

<p align="center">
  <a href="https://teseor.github.io/teseor/">Documentation</a> &middot;
  <a href="https://teseor.github.io/teseor/components/button/">Components</a> &middot;
  <a href="https://teseor.github.io/teseor/tokens/colors/">Tokens</a> &middot;
  <a href="https://github.com/teseor/teseor/issues">Issues</a>
</p>

---

## Why Teseor?

- **CSS-only** -- works with React, Vue, Svelte, Astro, plain HTML. No JS runtime.
- **Design tokens** -- 3-tier fallback system: component, global, hardcoded. Fully themeable via CSS custom properties.
- **8px grid rhythm** -- every component height snaps to an 8px grid, enforced by visual regression tests.
- **Modern CSS** -- built on `@layer`, `color-mix()`, container queries, anchor positioning, scroll-driven animations.
- **Standalone imports** -- use the full bundle or cherry-pick individual components.
- **62 components** across 9 categories, 16 layout primitives, 10 utility sets.

## Quick start

```bash
npm install @teseor/css
```

```css
@import '@teseor/css/dist/index.css';
```

```html
<button class="ui-button ui-button--primary">Get started</button>
```

### CDN

No build step needed -- use directly from jsDelivr or unpkg:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@teseor/css@2/dist/index.css">
```

Or unpkg:

```html
<link rel="stylesheet" href="https://unpkg.com/@teseor/css@2/dist/index.css">
```

## Theming

Override any token at the root level:

```css
:root {
  --ui-color-primary: oklch(55% 0.25 270);
  --ui-radius-base: 4px;
  --ui-font-sans: "Inter", system-ui, sans-serif;
}
```

Or scope overrides to a specific component:

```css
.my-hero .ui-button {
  --ui-button-height: 3.5rem;
  --ui-button-radius: 999px;
}
```

Every component documents its public custom properties in the [API reference](https://teseor.github.io/teseor/).

## Components

| Category | Components |
|----------|-----------|
| **Actions** | button, button-group, close-button |
| **Typography** | heading, link, code, code-block, kbd, blockquote, list, mark |
| **Forms** | input, select, checkbox, radio, toggle, slider, textarea, fieldset, field, label, form, form-error, form-helper, number-input, password-input, search-input, checkbox-group, radio-group |
| **Data display** | avatar, badge, card, table, tag, stat, status, data-list, icon, image |
| **Feedback** | alert, spinner, progress, progress-circle, skeleton, toast |
| **Overlays** | modal, dialog, drawer, tooltip, popover, overlay |
| **Disclosure** | accordion, disclosure |
| **Navigation** | tabs, breadcrumb, menu, dropdown-menu, nav, pagination |
| **Content** | divider, spacer, scroll-area |

**Layout primitives**: app-shell, grid, column, row, box, center, container, content, sidebar, sidebar-nav, topbar, nav-rail, page-header, footer, main, aspect-ratio

**Utilities**: spacing, display, position, text, border, container, visually-hidden, scroll-snap, scroll-animation, view-transition

## Browser support

Built for modern evergreen browsers. Uses `@layer`, `color-mix()`, and native CSS custom properties.

| Chrome | Firefox | Safari | Edge |
|--------|---------|--------|------|
| 99+ | 97+ | 15.4+ | 99+ |

## Development

```bash
git clone https://github.com/teseor/teseor.git
cd teseor
pnpm install
pnpm dev                   # docs dev server at localhost:3000
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development guide.

## Roadmap

Tracked in [GitHub Issues](https://github.com/teseor/teseor/issues). Current focus areas:

- CI hardening (bundle size tracking, docs preview, spell check)
- Modern CSS adoption (container queries, popover API, entry/exit animations)
- Docs site search and content improvements
- Production build optimization (fallback stripping)

## License

[MIT](LICENSE)
