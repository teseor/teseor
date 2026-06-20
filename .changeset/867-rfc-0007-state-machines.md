---
"@teseor/primitives": minor
---

Add `useStateMachine` (framework-agnostic core + React/Vue adapters) — a small per-part state-machine runtime for composite specs. Drives transitions declared in the YAML `states:` block: synchronous and timer-deferred (`after:`) transitions, latest-snapshot guard reads, prototype-key resistance via `Object.hasOwn`. The wrapper templates continue to call `useOverlay` for focus trap / scroll lock / portal mount.
