# @teseor/css

## 1.11.0

### Minor Changes

- 2fc20a1: Add scroll-snap utility classes for containers (snap-x, snap-y, proximity variants) and children (snap-start, snap-center, snap-end)
- 8678686: Add text-wrap utilities (balance, pretty, nowrap) and multi-line truncation (truncate-2/3/4). Apply text-wrap: balance to headings by default.

### Patch Changes

- d514364: Add prefers-contrast media query support for increased and decreased contrast preferences

## 1.10.1

### Patch Changes

- 6aee545: Fix NX cache inputs, remove unused dependencies, add docs-css typecheck
- 2ffba42: Move token definitions from styles layer to tokens layer for consistency
- 86f9180: Remove dead storybook config, orphaned scripts, and unused build targets
- aff8b90: Add missing docs for container and main layouts, enhance component documentation
- ea18a50: Add SCSS variable fallbacks to all component token vars for resilience without CSS custom property definitions

## 1.10.0

### Minor Changes

- 3f22514: Test release flow

## 1.9.0

### Minor Changes

- 10a5dcb: Auto-generate api.json from SCSS annotations. Adds @desc token descriptions, @component/@element/@modifier/@related SCSS annotations, and a new generate:api script with lint-time staleness check. Removes manually maintained api.json in favor of SCSS as single source of truth.

### Patch Changes

- f5bfcb3: Extract pure functions from build scripts into testable modules and add 85 vitest unit tests. Add Test CI job.
- 4653991: Add lint checks to prevent regressions: ban :focus (enforce :focus-visible), require id/title in docs.json, error on raw html in items, detect SCSS interpolation in api.json.
- 10a5dcb: Replace hardcoded literal fallbacks in token var() expressions with SCSS variable references. Add duration-normal and z-drawer tokens. Add lint rule to prevent hardcoded fallback regression.

## 1.8.0

### Minor Changes

- 8ea2179: Add accessibility features: focus-visible upgrade, prefers-reduced-motion, prefers-color-scheme auto-detection, forced-colors support
- bebbb65: Add missing component modifiers: badge/tag lg size, checkbox/radio success state, card interactive variant, alert size/dismissible, tabs size/vertical orientation. Fix 8 docs.json missing id/title. Add 5 layout visual specs. Update hygen template.
- 5e51837: Reorganize project structure: remove numbered folder prefixes, rename layout primitives (stack to column, cluster to row, remove flex), consolidate related doc pages via mergeInto, redesign sidenav with collapsible groups, convert scripts to TypeScript

### Patch Changes

- 86b0f29: Fix text-only item rendering in test HTML generator, convert grid-alignment test to self-contained

## 1.7.0

### Minor Changes

- f9c972d: Add dropdown-menu component for trigger button with floating menu panel
- f6ca4cc: Add number-input component with increment and decrement stepper buttons
- b5a3409: Add password-input component with toggle visibility button
- d9f46bb: Add scroll-area component for scrollable containers with styled scrollbars

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
