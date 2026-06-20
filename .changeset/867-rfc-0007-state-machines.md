---
"@teseor/primitives": minor
"@teseor/contract": minor
---

Add `useStateMachine` to `@teseor/primitives` (framework-agnostic core + React/Vue adapters) — a small per-part state-machine runtime for composite specs. Drives transitions declared in the YAML `states:` block: synchronous and timer-deferred (`after:`) transitions, latest-snapshot guard reads, prototype-key resistance via `Object.hasOwn`. The composite wrappers continue to call `useOverlay` for popover toggling, focus trap, scroll lock, and portal mount.

Generate a per-spec `<Name>State` union from the `states:` map. `ModalState` and `TooltipState` (`"open" | "closed"`) are exported from `@teseor/contract`; future composites with `states:` get the same treatment automatically.
