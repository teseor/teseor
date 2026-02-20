# @teseor/css

## 2.5.2

### Patch Changes

- 2321f92: Add CDN usage examples to README
- ecc1d4e: Update README and package documentation

## 2.5.1

### Patch Changes

- 7efdb24: Upgrade build tooling: nx 22, vite 7, biome 2, patch transitive vulnerabilities

## 2.5.0

### Minor Changes

- d114dca: Add container query utilities (container-inline, container-normal), nav responsive modifier with auto-collapse via @container, and input auto-size modifier with field-sizing: content.

## 2.4.0

### Minor Changes

- 8b414a8: Tokenize sidebar-nav text-transform/letter-spacing and tabs line-height as CSS custom properties. Refine core token defaults (primary, neutral, radius, shadow, font stacks). Extend position utilities with inset scale, z-index, and overflow variants.

## 2.3.2

### Patch Changes

- 0c5d827: Fix grid violations: replace ui-p-2 with ui-card--sm on cards, add ui-button to bare button in docs

## 2.3.1

### Patch Changes

- c8d9b74: Fix grid rhythm violations: align tag--sm/tag--lg to 8px grid, fix demo container heights
- 79e7870: Add Dracula, GitHub, Amazon, Linear theme presets to docs sidebar

## 2.3.0

### Minor Changes

- a2224d6: Add bg-inset token for component track/bar backgrounds, tighten grid rhythm tolerance, distinct debug overlays, root-cause grid checker, playground improvements

## 2.2.2

### Patch Changes

- 187fcd2: Replace hardcoded pixel values with design tokens across 8 components

## 2.2.1

### Patch Changes

- 169d15e: Merge duplicate @layer blocks in PostCSS output and fix layer declaration order

## 2.2.0

### Minor Changes

- ad43d25: Split @layer tokens into tokens.core / tokens.scale / tokens.semantic for clearer DevTools hierarchy and theming. Font sizes now derive from --ui-font-size-base via calc().

## 2.1.0

### Minor Changes

- c5faff4: Split @layer tokens into tokens.core / tokens.scale / tokens.semantic for clearer DevTools hierarchy and theming. Font sizes now derive from --ui-font-size-base via calc().

## 2.0.2

### Patch Changes

- d8feebe: Fix PostCSS prefix leak on internal --\_ custom properties and add missing 3-tier token fallbacks

## 2.0.1

### Patch Changes

- 25f58de: Fix PostCSS prefix leak on internal --\_ custom properties and add missing 3-tier token fallbacks

## 2.0.0

### Major Changes

- b22d30f: Rename --ui-leading-_ tokens to --ui-line-height-_ for CSS property name consistency. Clean break — old names removed entirely. Add banned-token-names lint rule to prevent regression.
- 6a2e057: Rename --ui-tracking-_ to --ui-letter-spacing-_ and --ui-z-_ to --ui-z-index-_ for CSS property name consistency. Clean break — old names removed entirely. Add banned-token-names lint rule to prevent regression.
- 599fc43: Rename --ui-weight-_ tokens to --ui-font-weight-_ for CSS property name consistency. Clean break — old names removed entirely. Add banned-token-names lint rule to prevent regression.

### Patch Changes

- 798f6a3: Add token dictionary as single source of truth, replace ad-hoc banned-name regexes with dictionary-based lint, extract lint functions into modular files, add token architecture guide

## 1.16.0

### Minor Changes

- 05ac1a7: Add color-mix() shade tokens for success, warning, and danger (light, dark, subtle, hover variants). Remove disconnected --ui-hue-primary token — shadows now derive from --ui-color-neutral via color-mix(). Theme demos updated to override --ui-color-primary directly.
- d9d763d: Remove unused --ui-spacing-_ semantic aliases (xs/sm/md/lg/xl/gutter/section). No consumer references existed — use --ui-space-_ numeric tokens instead.
- 51219e0: Add position, overflow, and inset utility classes; replace 154 inline styles with demo- prefixed classes
- d597467: Add --ui-radius-base theme knob token. Override it once to control all border radii (sm, md, lg derive from it). Simplifies theming — e.g. `--ui-radius-base: 2px` for sharp corners.

## 1.15.7

### Patch Changes

- c21d232: Redesign docs home page using DS components: grid layout, cards, badges, tags, headings, links, and dividers

## 1.15.6

### Patch Changes

- 5bc487d: Replace 135 inline styles with existing DS utility classes across 18 docs.html files

## 1.15.5

### Patch Changes

- f9db3f5: Fix corrupted style attributes in content and nav-rail docs (character-split serialization bug). Replace with utility classes where possible.

## 1.15.4

### Patch Changes

- 7042c54: Replace hardcoded values with design tokens across 13 component/layout files. Add 8 new SCSS tokens: tracking-wide, focus-ring-offset, stripe-highlight, container-threshold-sm, grid-col-min, icon-size-inline, font-size-relative-xs, font-size-relative-sm.

## 1.15.3

### Patch Changes

- 20b121a: Wrap all visible text in docs with t() for i18n readiness

## 1.15.2

### Patch Changes

- af4a7ae: Replace 76 individual visual spec files with a single auto-discovery spec

## 1.15.1

### Patch Changes

- 6b75a3c: Rename colocated files to generic names (api.json, docs.html, visual.spec.ts, visual.png) and auto-derive type/id from folder path

## 1.15.0

### Minor Changes

- 0c16544: Migrate docs format from JSON to HTML templates with Nunjucks support

## 1.14.3

### Patch Changes

- 05f69da: Add design-tokens overview, root, and debug docs; inline grid-overlay into debug/index
- 4355c2a: Move guides to config/guides/, add Getting Started guide, reorder sidenav
- 82f55f4: Move test utilities from src/testing/ to packages/css/test-utils/

## 1.14.2

### Patch Changes

- a7d27d3: Flatten single-file folders in config/tokens and base, add @layer tokens wrapper to input.scss
- d2ab77f: Restructure \_variables.scss sections to mirror token import order, add semantic spacing vars

## 1.14.1

### Patch Changes

- cc86b63: Fix 3-layer token pattern violations and enforce lint rules as errors

## 1.14.0

### Minor Changes

- 984543b: Add anchor positioning support to tooltip with --anchored modifier
- 74fb0a7: Register @property typed custom properties for progress and progress-circle smooth transitions
- 1f48e12: Add scroll-driven animation utilities with progress indicator and viewport-triggered effects

## 1.13.0

### Minor Changes

- d616cd8: Add subgrid support and span utilities to grid primitive

## 1.12.0

### Minor Changes

- 21599d9: Add container query support with responsive card and field modifiers
- a8949d7: Refactor dark mode tokens with CSS light-dark() function

### Patch Changes

- 5f7f59d: Enforce docs coverage validation: fix 18 gaps across api.json and docs.json files
- edea453: Add field-sizing: content modifier for auto-sizing textareas

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
