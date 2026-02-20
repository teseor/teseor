# @teseor/css

CSS components library with design tokens, 8px grid rhythm, and standalone component support.

## Installation

```bash
npm install @teseor/css
# or
pnpm add @teseor/css
```

### CDN

Use directly without a build step:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@teseor/css@2/dist/index.css">
<!-- or -->
<link rel="stylesheet" href="https://unpkg.com/@teseor/css@2/dist/index.css">
```

## Usage

### Full bundle (recommended)

Import everything -- tokens, reset, base styles, components, and utilities:

```css
@import '@teseor/css/dist/index.css';
```

### Standalone component

Components include hardcoded fallbacks and work without the token layer:

```css
@import '@teseor/css/dist/components/button.css';
```

Without the full bundle, theming via CSS custom properties won't apply.

## Theming

### Global tokens

Override design tokens at the root level:

```css
:root {
  --ui-color-primary: oklch(55% 0.25 270);
  --ui-radius-base: 4px;
  --ui-font-sans: "Inter", system-ui, sans-serif;
  --ui-shadow-strength: 8%;
}
```

### Component-level overrides

Each component exposes `--ui-<component>-*` custom properties:

```css
:root {
  --ui-button-bg: navy;
  --ui-button-radius: 0;
}

.my-special-button {
  --ui-button-bg: gold;
}
```

### Token cascade

Components use a three-level fallback:

```
--ui-button-bg  ->  --ui-color-primary  ->  oklch(55% 0.22 250)
 (component)         (global token)          (hardcoded fallback)
```

1. **Component token** (`--ui-button-bg`) -- highest priority, scoped override
2. **Global token** (`--ui-color-primary`) -- design system default
3. **Hardcoded fallback** -- static value for standalone usage

## Components (62)

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

**Layout primitives** (16): app-shell, grid, column, row, box, center, container, content, sidebar, sidebar-nav, topbar, nav-rail, page-header, footer, main, aspect-ratio

**Utilities** (10): spacing, display, position, text, border, container, visually-hidden, scroll-snap, scroll-animation, view-transition

## Naming

- **Classes (BEM)**: `.ui-button`, `.ui-button--primary`, `.ui-button__icon`
- **Global tokens**: `--ui-color-primary`, `--ui-space-2`, `--ui-row-2`
- **Component tokens**: `--ui-button-height`, `--ui-input-radius`
- **Internal vars**: `--_bg`, `--_height` (component-scoped, not public API)

## Source structure

```
packages/css/src/
  config/          # Layer order, design tokens, guides
  reset/           # CSS reset
  base/            # Base HTML element styles
  layout/          # Layout primitives (grid, column, row, box, ...)
  components/      # UI components grouped by category
    actions/       # button, button-group, close-button
    typography/    # heading, link, code, ...
    forms/         # input, select, checkbox, ...
    data-display/  # avatar, badge, card, ...
    feedback/      # alert, spinner, progress, ...
    overlays/      # modal, dialog, drawer, ...
    disclosure/    # accordion, disclosure
    navigation/    # tabs, breadcrumb, menu, ...
    content/       # divider, spacer, scroll-area
  utilities/       # Helper classes
  debug/           # Dev tools (grid overlay, token inspector)
```

Each component directory contains:
- `index.scss` -- styles with internal tokens (`--_` prefix)
- `<name>.api.json` -- CSS API definition (classes, modifiers, custom properties)
- `<name>.docs.json` -- documentation content
- `<name>.visual.spec.ts` -- visual regression test

## Development

```bash
pnpm nx build css          # build the package
pnpm nx test css           # visual regression tests (Playwright)
```

See the root [CONTRIBUTING.md](../../CONTRIBUTING.md) for the full development workflow.

## License

[MIT](../../LICENSE)
