# @teseor/css

## 3.1.0

### Minor Changes

- 49a5736: Real PostCSS build pipeline (`postcss-import` + `postcss-each` + `postcss-custom-media`) replaces the stub `build` script. `dist/` now contains:
  - `dist/teseor.css` — full bundle (reset + tokens + base + utilities) in layer order.
  - `dist/tokens.css`, `dist/utilities.css`, `dist/tailwind.css` — individual entry points.

  New utility classes (`t-` prefix): `t-p-{0..8}`, `t-px-{0..8}`, `t-py-{0..8}`, `t-m-{0..8}`, `t-mx-{0..8}`, `t-my-{0..8}`, `t-gap-{0..8}` over the `--t-space-*` scale; `t-block`, `t-inline`, `t-inline-block`, `t-flex`, `t-inline-flex`, `t-grid`, `t-inline-grid`, `t-contents`, `t-hidden`. Output is deterministic across runs. Size-limit budget added.

- 3ca5c4b: First component: `.t-button`. Drives all four variants (solid, outline, ghost, link), five intents (primary, neutral, success, warning, danger), three sizes (sm, md, lg), and the visual states for hover, active, focus-visible, disabled, and loading. Bundled into the full `@teseor/css` entry; per-component bundle arrives when more than one component ships.
- a1f28c6: Add Stack and Cluster layout primitives. Stack stacks children on the block axis with `gap` (token suffix) and `align` (start/center/end/stretch), responsive across breakpoints. Cluster wraps children on the inline axis with `gap`, `align` (start/center/end/stretch/baseline), and `justify` (start/center/end/between/around), also responsive.

  Generated React, Vue, and contract surfaces ship for both components, with the same DOM contract and CSS data-attribute hooks as Button. Per-component CSS bundles (`@teseor/css/components/stack.css`, `@teseor/css/components/cluster.css`) plus inclusion in the full `dist/teseor.css` entry.

  Codegen pipeline hardened along the way: gen-react now narrows the ref type to the concrete HTMLElement subtype when no `as` prop is present, and emits short destructures and type intersections on a single line so generated React wrappers stay biome-clean. gen-tests no longer emits an unused `SLOT` helper for specs without slot props.

- 03cef3b: Component CSS now ships with a literal fallback inlined into every `--t-*` token reference, resolved from `tokens.css` at build time by the in-house `postcss-teseor-floor` plugin. A per-component file (`@teseor/css/components/button.css`) renders with correct default values even when `tokens.css` is absent — `var(--t-button-bg, var(--t-accent))` ships as `var(--t-button-bg, var(--t-accent, oklch(65% 0.18 250deg)))`. The build fails if component CSS references a `--t-*` token not declared in `tokens.css`.
- 85e5378: Adds `motion.css` — shared `@keyframes` (`fade-in`/`fade-out`, `slide-up-in`/`slide-down-out`, `scale-in`/`scale-out`, `spin`) with `prefers-reduced-motion` variants that redefine the entrance keyframes to an immediate jump. Bundled into `teseor.css` and published as a standalone `@teseor/css/motion.css`. The motion tokens (`--t-dur-*`, `--t-ease-*`, `--t-motion-scale`) already ship in `tokens.css`.
- d4ea1eb: Add `--t-density` multiplier and `--t-touch-min` floor to `tokens.css`. Spacing shorthands (`--t-pad-x`, `--t-pad-y`, `--t-gap`, `--t-row`) multiply by `--t-density`; `--t-row` is floored at `--t-touch-min` (44px @ 16px root) so a compact density cannot shrink an interactive root below the WCAG 2.5.5 touch target. `[data-density="compact"]` and `[data-density="comfortable"]` reassign `--t-density` (`0.875` / `1.125`) on the subtree they apply to.

### Patch Changes

- dff9b54: Component CSS/DOM hygiene. The button's spinner span renders only when `loading` — non-loading buttons no longer carry an empty `<span data-button-spinner>`. Component CSS box-sizes itself and its named parts instead of every descendant (`& *`), so a layout primitive no longer reaches into nested components; a stylelint rule (`selector-max-universal: 0`) enforces it. The loading state hides the label with `opacity: 0` instead of `visibility: hidden`, keeping it in the accessibility tree.
- ff6290c: Every emitted CSS file now declares the full `@layer` order up front, not just the bundle. CSS `@layer` precedence is fixed by first encounter, so loading a per-component file (`@teseor/css/components/*.css`) before — or without — the full bundle previously left the order undefined: reset rules could outrank component rules, and a component could render unstyled. The `@layer` statement is idempotent, so repeating it across files is harmless and makes the cascade independent of load order.
- 7b95804: Add the React wrapper generator and the @teseor/react package. The generated Button.tsx renders the t-button class plus data-attributes, supports the value-or-object responsive API for size and block, polymorphic root via as, ReactNode slots for iconStart and iconEnd, native ref-as-prop (React 19), Readonly props, "use client" directive, className merge, and aria-busy on loading. Shared dataAttrs runtime so the helper ships once per bundle, not per component.

  Contract gains a slot field on props (emitted as unknown for non-React consumers); rootClass field is now recognized at the spec level.

  Button CSS gains the responsive selector set for size and block across md, lg, xl, and 2xl breakpoints.

- c48b0f8: Strip process commentary, build-pipeline notes, and doc-path pointers from `tokens.css` comments. No runtime or value change; only the source comments shrink.
- 84a0432: Component CSS re-authored to a token-driven model: `components.tokens` declares every mutable value as a `--_*` custom property, the base reads those vars, and every `[data-*]` modifier reassigns vars only instead of declaring properties — so stacking variants, intents, and sizes is conflict-free. Rendered output is unchanged. Each component root now declares its own `box-sizing` and `margin` rather than leaning on `reset.css`, and `button` / `stack` / `cluster` gain `--t-button-gap`, `--t-stack-align`, `--t-cluster-align`, and `--t-cluster-justify` override slots.
