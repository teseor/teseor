# ADR-0013 — Overlay modality: `popover.modal`, focus-trap auto-activation, inert cascade

- **Status:** Proposed.
- **Deciders:** repo owner (letanure).

## Decision

Add a `modal: boolean` field to the spec's `popover:` block (default `false`). The wrapper hook `useOverlay` consumes the existing `useDismissableLayer` primitive for every overlay (always-on) and additionally activates the existing `useFocusTrap` primitive plus an inert cascade when `popover.modal: true`. The inert cascade is a new small primitive (`@teseor/primitives/src/modality/`) that masks every direct `<body>` child not containing the modal element, restored on close, stacked per `element.ownerDocument`. Modal popovers render into a body-level portal so the "direct body-children" target set is well-defined; non-modal popovers render in place since the Popover API's top layer handles z-index regardless of DOM position.

## Why this and not the alternatives

- **Not "build a new overlay stack."** Issue #675 proposed `packages/{react,vue}/src/_overlay-stack.ts`. `@teseor/primitives/dismissable-layer` (#654) already ships exactly that: per-`ownerDocument` Map-keyed stack, Escape goes to topmost, pointer-down-outside checks `composedPath()` containment per layer, snapshot iteration so destroy-during-callback is safe, React + Vue + vanilla adapters sharing one singleton. Rebuilding it would duplicate working code.
- **Not gating dismissable-layer wiring on a spec flag.** `popover.dismissable: boolean` would default to `true` almost everywhere; an always-on wire-up in `useOverlay` is a single mental model. Tooltip's previous spec-level `keydown:Escape@document` rule had no stack semantics — two stacked overlays both closing on one Escape was undefined-by-design; the layer's topmost-wins listener replaces it.
- **Not sibling-walk for inert.** Walking up from the popover and inerting every sibling at every ancestor (Radix's `FocusScope`) plays poorly with deeply-nested popovers and CSS-transformed ancestors. "inert every body-child that doesn't contain the modal" needs the portal as a precondition but keeps the target set portable; matches React Aria's `OverlayContainer`.
- **Not folding the inert logic into `useOverlay`.** The inert cascade is generic DOM coordination — same shape as dismissable-layer and focus-trap (per-`ownerDocument` stack, framework-thin adapters, single concern). It belongs in `@teseor/primitives`, alongside its siblings, not in a wrapper-internal hook. ADR-0012's layering carries this case.
- **Not unconditional portal for every overlay.** Non-modal popovers don't need a portal — the Popover API's top layer handles z-index regardless of DOM position. Portal carries a real cost for component-testing (root not in queries) so opt-in keeps the simple case simple.

## Consequences

- **Spec schema gains `popover.modal: boolean`.** Existing specs (Tooltip) unchanged. Dialog spec sets `true`. Zod field + semantic check that's a one-line `z.boolean().optional().default(false)`.
- **`useOverlay` takes new dependencies.** `@teseor/primitives/dismissable-layer` for every overlay; `@teseor/primitives/focus-trap` and the new modality primitive only when `modal: true`.
- **New primitive: `@teseor/primitives/src/modality/`.** `createModalityScope` + React/Vue adapters. Follows the eight-rule pattern (`project_headless_primitive_patterns`): DOM-null guards, `ownerDocument`-keyed Map, capture-phase listeners where needed, snapshot iteration, exported event-type alias for any future widening.
- **Codegen.** When `popover.modal: true`, the emitted JSX/Vue template wraps the popover element in a `createPortal` call. New conditional in `scripts/codegen/src/generators/gen-react.ts` and `gen-vue.ts`.
- **Runtime guard.** When `Element.prototype.inert === undefined`, `warnOnce("primitives.modality.unsupported", …)` and no-op the assignments. Same fallback shape as the popover-API guards added in #696.
- **Tooltip behavior change (narrow).** Escape now routes through the layer (topmost-wins) instead of Tooltip's spec-level document-keydown rule, which becomes redundant and is removed in PR A. The outside-pointer notification arrives but Tooltip already closes on `mouseleave`, so it's effectively a no-op channel for Tooltip. Single-Tooltip behavior is unchanged; nested-overlay behavior now stacks correctly.
- **Tooltip-on-modal-Dialog-trigger degrades naturally.** An open modal Dialog sits in a body-level portal; every other body-child is inert. The trigger button lives under an inert ancestor → can't fire `focus` / `mouseover` → tooltip stays closed. No special-case logic.
- **Two-PR split.** PR A — `refactor(wrapper): useOverlay consumes useDismissableLayer` — wires the always-on stack participation, removes Tooltip's now-redundant `keydown:Escape@document` interaction rule (covered by the layer), no new primitive, adds behavior tests for stacked Escape / outside-pointer. PR B — `feat(spec+wrapper): popover.modal + modality primitive + portal/focus-trap activation` — adds `modal` to the schema, introduces `@teseor/primitives/modality`, wires focus-trap and inert in `useOverlay`, emits portal in codegen when modal, lands a minimal Dialog spec so the new schema field has a consumer. PR B depends on PR A.
- **Status flips to Accepted when PR B merges.**

## References

- [#675](https://github.com/teseor/teseor/issues/675) — original issue body (stale on the stack-mechanics points; this ADR is the reframe)
- [ADR-0011](0011-css-anchor-positioning-for-overlays.md) — CSS Anchor + Popover API as the rendering surface
- [ADR-0012](0012-wrapper-internal-seam.md) — generated `_runtime.ts` vs hand-authored hooks / composables / components folders
- `.changeset/654-primitives-dismissable.md` — dismissable-layer primitive (the stack this ADR consumes)
- `.changeset/654-primitives-focus-trap.md` — focus-trap primitive
- Project memory: `project-headless-primitive-patterns`, `feedback-critically-review-before-implementing`
