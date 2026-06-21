# ADR-0023 — State-machine runtime lives in `@teseor/primitives`

- **Status:** Accepted (2026-06-20). Implementation shipped in PR #872.

## Decision

The runtime that drives a composite spec's per-part state machine
lives in `@teseor/primitives` as `useStateMachine`. The package
contains a framework-agnostic core
(`packages/primitives/src/state-machine/index.ts`) plus two thin
adapters: `packages/primitives/src/state-machine/react.ts` and
`packages/primitives/src/state-machine/vue.ts`. Both adapters
re-export from the top-level entry points
`packages/primitives/src/react.ts` and
`packages/primitives/src/vue.ts`.

Side effects that are not state — focus trap, scroll lock, portal
mount, dismissable layer — stay in their own primitives
(`focus-trap`, `modality`, `portal`, `dismissable-layer`) and are
wired by the wrapper based on declarative fields (`overlay.modal:
true`, `a11y.role: dialog`). The state machine does not invoke them.

No external state-machine library (Zag, XState, Robot) is adopted.
Wrapper code and codegen templates do not import from any
third-party machine runtime.

## Why this and not the alternatives

- **Not Zag.js.** Spiked against `<Modal>` on a throwaway branch
  during the RFC-0007 cycle (handover § "Zag spike closed without
  adopting"). Bundle was acceptable (17 KB gz alone, 30 KB with a
  second machine, 40 KB with three). The decision is taste and
  architecture, not size: importing `@zag-js/dialog` into wrapper
  source conflates Teseor with its upstream library, breaks the YAML
  spec's portability guarantee (the runtime under the spec must be
  ours for the spec to mean anything outside this codebase), and
  forces every future machine to be expressible in Zag's vocabulary.
- **Not XState.** The full statechart machinery (parallel states,
  history, invoked services, actions, guards-as-functions) is a
  superset of every case Teseor specs need. Adopting it imports a
  modeling surface authors do not use, costs bundle for features
  unused, and ties the spec format to XState's config shape.
- **Not in `@teseor/contracts`.** Contracts is the type-only
  generated package; runtime code there breaks the "contracts is
  a zero-runtime import" guarantee that the contracts package
  exists to provide.
- **Not in each framework wrapper package independently.** Two
  copies of the same ~150 LOC drift; the validator and the runtime
  carry the same vocabulary, and the runtime is small enough that
  a shared core costs less than the drift would.
- **Not "leave the legacy `useOverlay` interactions runtime in
  place."** The existing flat-rules runtime — `OverlayInteraction[]`
  with `{ on, do, delay, when }` — was a two-state shape with the
  `disabled` guard hardcoded. It worked for Modal and Tooltip and
  nothing else. The state-machine runtime is the generalization
  every future stateful composite (Combobox, Menu, Popover, Disclosure
  variants) needs.

## Consequences

- `packages/primitives/src/state-machine/` ships three TypeScript
  files (core + React + Vue) plus runtime tests. The core is around
  150 lines; the adapters are around 50 each. The package exports
  `useStateMachine` and `UseStateMachineResult` from both
  framework entry points.
- The transition shape is `{ to, after, when, emits }` with the
  spec-level `<part>.<event>` source resolved at codegen time into a
  `sourceKey` the runtime dispatches against. Authors do not
  hand-write state-machine config; codegen emits it from the spec's
  `states:` block.
- The runtime handles `after:` delays via `setTimeout`; transitions
  that fire from a competing source key cancel the pending timer.
  No entry/exit actions, no nested machines, no parallel states.
- `useOverlay` continues to host focus trap, scroll lock, portal
  mount, and dismissable layer for parts with `overlay.modal: true`.
  Its open/close state ownership in the legacy interactions runtime
  is the open architectural question tracked in handover § "useOverlay
  vs useStateMachine ownership" — not resolved by this ADR.
- Consumers cannot swap in a third-party machine. That is the trade
  for portability: a YAML spec from this project compiles against a
  known runtime; the runtime travels with the wrapper packages.
- Project memory (`feedback_no_external_runtime_deps`) is the
  durable form of this constraint and applies to every future
  runtime decision in the same family.

## References

- [RFC-0007](../RFC/0007-spec-structural-readability.md) — sections
  "Generator implications" and "Adoption" describe the runtime.
- [ADR-0011](0011-css-anchor-positioning-for-overlays.md) — the
  overlay positioning primitive; the state machine does not own
  positioning.
- [ADR-0013](0013-overlay-modality.md) — `overlay.modal: true`
  drives the focus-trap / scroll-lock cascade outside the state
  machine.
- [#871](https://github.com/teseor/teseor/issues/871) — the Zag
  spike issue; closed without adopting. Bundle measurements
  recorded in the issue thread.
