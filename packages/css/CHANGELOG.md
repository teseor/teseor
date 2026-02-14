# @teseor/css

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
