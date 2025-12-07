# UI Lib

CSS-first UI library with grid rhythm system. Framework-agnostic components built on design tokens.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 for live docs.

## Packages

| Package | Description |
|---------|-------------|
| `@ui-lib/tokens` | Design tokens (colors, spacing, typography, grid) |
| `@ui-lib/css` | CSS components and utilities |

## Usage

```html
<link rel="stylesheet" href="@ui-lib/css/dist/index.css">

<button class="ui-button ui-button--primary">Primary</button>
<button class="ui-button ui-button--secondary ui-button--sm">Small Secondary</button>
```

### CSS Custom Properties

Override at root level:
```css
:root {
  --ui-color-primary: #0066cc;
  --ui-button-height: 3rem;
}
```

Or per-component:
```html
<button class="ui-button" style="--ui-button-bg: #ff6600;">Custom</button>
```

## Development

```bash
pnpm dev          # Start docs dev server
pnpm build        # Build all packages
pnpm lint         # Lint (Biome + Stylelint)
pnpm test         # Run tests
```

### Adding Components

1. Create folder in `packages/css/src/04-components/<name>/`
2. Add `index.scss`, `<name>.api.json`, `<name>.docs.json`
3. Run `pnpm --filter docs build-docs`

## Architecture

```
packages/
  tokens/         # Design tokens (CSS custom properties)
  css/            # Components organized by ITCSS layers
    00-config/    # Layer definitions, global tokens
    01-reset/     # CSS reset
    02-base/      # Base element styles
    03-layout/    # Layout primitives (stack, grid, center)
    04-components/ # UI components (button, card, etc)
    05-utilities/ # Helper classes
    99-debug/     # Dev tools
apps/
  docs/           # Living documentation site
```

## Naming

- CSS classes: `.ui-button`, `.ui-button--primary`, `.ui-button__icon`
- Tokens: `--ui-color-primary`, `--ui-space-2`, `--ui-button-height`
- Internal vars: `--_bg`, `--_height` (component scope only)

## License

MIT
