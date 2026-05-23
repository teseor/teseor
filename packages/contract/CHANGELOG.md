# @teseor/contract

## 3.1.0

### Minor Changes

- 2553b8e: Constrain the polymorphic `as` prop to a closed set of element names. Button's `as` is now typed `"button" | "a"` across `@teseor/contract`, `@teseor/react`, and `@teseor/vue` instead of `string` / `ElementType`. Custom React components are intentionally not allowed — the `as` prop is a semantic element swap; wrapping-around-X composition stays a `dependencies:` / `parts:` concern. The validator (`pnpm lint:spec`) rejects an `as` prop that omits `values:`.
- a1f28c6: Add Stack and Cluster layout primitives. Stack stacks children on the block axis with `gap` (token suffix) and `align` (start/center/end/stretch), responsive across breakpoints. Cluster wraps children on the inline axis with `gap`, `align` (start/center/end/stretch/baseline), and `justify` (start/center/end/between/around), also responsive.

  Generated React, Vue, and contract surfaces ship for both components, with the same DOM contract and CSS data-attribute hooks as Button. Per-component CSS bundles (`@teseor/css/components/stack.css`, `@teseor/css/components/cluster.css`) plus inclusion in the full `dist/teseor.css` entry.

  Codegen pipeline hardened along the way: gen-react now narrows the ref type to the concrete HTMLElement subtype when no `as` prop is present, and emits short destructures and type intersections on a single line so generated React wrappers stay biome-clean. gen-tests no longer emits an unused `SLOT` helper for specs without slot props.

- 78983e3: Spec props can now declare `values:` — a closed set of accepted strings. `gen-contract`, `gen-react`, and `gen-vue` emit a typed union (e.g. `StackAlign = "start" | "center" | "end" | "stretch"`) and type the prop with it instead of bare `string`, so invalid values are caught at the call site. `Stack`'s `align` and `Cluster`'s `align` / `justify` now ship as typed unions; open-set props like `gap` stay `string`.
- 7b95804: Add the React wrapper generator and the @teseor/react package. The generated Button.tsx renders the t-button class plus data-attributes, supports the value-or-object responsive API for size and block, polymorphic root via as, ReactNode slots for iconStart and iconEnd, native ref-as-prop (React 19), Readonly props, "use client" directive, className merge, and aria-busy on loading. Shared dataAttrs runtime so the helper ships once per bundle, not per component.

  Contract gains a slot field on props (emitted as unknown for non-React consumers); rootClass field is now recognized at the spec level.

  Button CSS gains the responsive selector set for size and block across md, lg, xl, and 2xl breakpoints.

### Patch Changes

- 1256eb4: Add @teseor/vue: Vue 3 wrappers generated from the same specs as @teseor/react. Same data-attribute surface, same CSS, identical rendered DOM.

  Refactor the React generator to be fully spec-driven. Slots, label-wrap, spinner, disabled/aria-disabled, polymorphic root, and data-attr prefixes all derive from spec contents instead of hardcoded component names. Button output is byte-identical after the refactor.

  Generated component files now include a JSDoc block with the description (from `spec.description`) and a first-example snippet (from `spec.examples[0]`), so IDE hover shows the component description before the expanded type signature.

  Add `examples` and `element` fields to the Spec type (already used in committed specs; now formally typed).

- 834ec32: `@teseor/contract` now emits responsive prop types: a `responsive: true` prop is typed `Responsive<T>` (e.g. `block?: Responsive<boolean>`), matching what the components actually accept — previously the contract under-described every responsive prop as a flat type. The React and Vue wrappers express the same type through a shared `Responsive<T>` alias instead of an inline `T | Partial<Record<...>>` union — structurally identical, just less verbose.
