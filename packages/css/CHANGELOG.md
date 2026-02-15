# @teseor/css

## 1.6.0

### Minor Changes

- ea57b2d: Add checkbox-group component for grouping related checkboxes with legend
- be7494d: Add radio-group component for grouping related radio buttons with legend
- 04e2cde: Add search-input component with icon, clear button, and size variants
- 81a7522: Add slider component for range value selection with size and color variants

## 1.5.0

### Minor Changes

- fcd1ac5: Add close-button component: dismiss button with size variants, subtle mode, and hover/focus/disabled states
- 9908ee0: Add code-block component: multi-line code display with monospace font, horizontal scroll, compact variant, and optional line numbers
- 86a36cd: Add fieldset component: form field grouping with legend, bordered/compact variants, and disabled state
- 81421a2: Add form component: layout container with field spacing, sections, actions row, compact and inline variants
- 8edc607: Add image component: responsive figure with fallback, caption, size/shape modifiers
- 9847487: Add list component: ordered/unordered lists with spacing, inline, unstyled variants
- af39744: Add progress-circle component: circular progress indicator with size, color variants, and indeterminate state

## 1.4.0

### Minor Changes

- bd632ab: Add content layout primitive with vertical spacing, prose mode, and flush variant
- 5bf4e1b: Add footer layout primitive with sticky/fixed positioning and border/shadow variants
- 497d79e: Add nav-rail layout primitive for narrow icon-based vertical navigation
- 1058272: Add page-header layout primitive with title, actions, breadcrumb slots
- 84ed987: Add topbar layout primitive with sticky/fixed positioning and sidebar/main integration

## 1.3.0

### Minor Changes

- 117b02f: Add aspect-ratio layout primitive with preset ratios (square, video, photo, wide, portrait) and custom ratio support
- 4100583: Add kbd, mark, blockquote, stat, and spacer components

### Patch Changes

- f94055b: Fix button-group vertical mode off-grid heights by removing negative margins

## 1.2.4

### Patch Changes

- 6337036: Remove dead fonts export and files entry from package.json
- 8f26dfd: Remove Google Fonts @import from CSS bundle; consumers load fonts separately

## 1.2.3

### Patch Changes

- 72aa8b8: Fix sidebar-nav active item contrast ratio for WCAG AA compliance and enable CSS minification

## 1.2.2

### Patch Changes

- fc15268: Add GitHub Packages registry publishing to release workflow

## 1.2.1

### Patch Changes

- 3ba784e: Fix debug overlay and shadow tokens referencing undefined hue variables
- 9d7fe0c: Reorganize components into functional category subdirectories

## 1.2.0

### Minor Changes

- [#176](https://github.com/teseor/teseor/pull/176) [`72540a6`](https://github.com/teseor/teseor/commit/72540a67532d476883f9cc97ecd3f2d65014e3c5) Thanks [@letanure](https://github.com/letanure)! - Add nav component with horizontal tabs, pills variant, and vertical layout support

- [#176](https://github.com/teseor/teseor/pull/176) [`72540a6`](https://github.com/teseor/teseor/commit/72540a67532d476883f9cc97ecd3f2d65014e3c5) Thanks [@letanure](https://github.com/letanure)! - Add centralized t-shirt sizing system with consistent size tokens across components

### Patch Changes

- [#180](https://github.com/teseor/teseor/pull/180) [`b82523a`](https://github.com/teseor/teseor/commit/b82523a40a74451162ecb698e7b828b41315cb37) Thanks [@letanure](https://github.com/letanure)! - Fix data-list divided variant border breaking grid rhythm

- [#176](https://github.com/teseor/teseor/pull/176) [`72540a6`](https://github.com/teseor/teseor/commit/72540a67532d476883f9cc97ecd3f2d65014e3c5) Thanks [@letanure](https://github.com/letanure)! - Replace hardcoded values in icon component with design token references

- [#176](https://github.com/teseor/teseor/pull/176) [`72540a6`](https://github.com/teseor/teseor/commit/72540a67532d476883f9cc97ecd3f2d65014e3c5) Thanks [@letanure](https://github.com/letanure)! - Fix PostCSS prefix for compound selectors to correctly prefix all class segments

## 1.1.0

### Minor Changes

- [`59cc32f`](https://github.com/teseor/teseor/commit/59cc32fa3a36c936f19ef68eef0ee0edce048085) Thanks [@letanure](https://github.com/letanure)! - Add progress, skeleton, breadcrumb, status components

## 1.0.0

### Major Changes

- [`c6dc063`](https://github.com/teseor/teseor/commit/c6dc063f8f5544620909335539246c810202fb3a) Thanks [@letanure](https://github.com/letanure)! - Initial public release of @teseor/css

  CSS-first component library with design tokens, layout primitives, and UI components.
