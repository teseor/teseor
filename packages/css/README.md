# @teseor/css

CSS components library with design tokens and standalone support.

## Installation

```bash
npm install @teseor/css
```

## Usage

### Option 1: Full Bundle (Recommended)

Import everything - tokens, reset, base styles, components, and utilities:

```css
@import '@teseor/css/dist/index.css';
```

### Option 2: Standalone Component

Components include SCSS fallbacks and work without tokens:

```css
/* Works standalone - uses hardcoded fallback values */
@import '@teseor/css/dist/components/button.css';
```

Note: Without tokens, theming via CSS custom properties won't work.

## Theming

### Global Tokens

Override design tokens at the root level:

```css
:root {
  --color-primary: hotpink;
  --radius-md: 0;
}
```

### Component-Level Overrides

Each component exposes `--component-*` custom properties:

```css
:root {
  /* Override all buttons */
  --button-bg: navy;
  --button-radius: 0;
}

.my-special-button {
  /* Override specific instance */
  --button-bg: gold;
}
```

## CSS Custom Property Cascade

Components use a three-level fallback system:

```
--button-bg -> --color-primary -> hardcoded fallback
```

1. **Component override** (`--button-bg`) - highest priority
2. **Global token** (`--color-primary`) - design system default
3. **SCSS fallback** (`hsl(220 85% 50%)`) - works standalone

## Available Components

- `button` - Buttons with size and style variants

## Folder Structure

```
packages/css/src/
  00-config/       # Layer definitions + global tokens
  01-reset/        # Reset/normalize styles
  02-base/         # Base HTML element styles
  03-layout/       # Layout primitives (stack, grid, container)
  04-components/   # UI components
  05-utilities/    # Helper classes
  99-debug/        # Dev tools
```

## Development

```bash
# Build
pnpm nx run css:build

# Watch
pnpm nx run css:watch

# Visual regression tests
npx playwright test
```
