---
"@teseor/react": patch
"@teseor/vue": patch
---

Runtime behavior tests for `_runtime.ts` in both wrapper packages, plus two
bug fixes surfaced by the new suite:

- `@teseor/react` Slot now warns and renders nothing when its child is a
  Fragment (previously it slipped past the single-child invariant and
  `cloneElement` silently dropped slot props).
- `@teseor/vue` Slot no longer double-merges event handlers — `cloneVNode`
  already calls `mergeProps` internally, so the wrapper's pre-merge was
  causing the child's `onClick` (and every other handler) to fire twice.

Tests cover `useOverlay`, `Slot`, `useActiveBreakpoint`, `isActiveAt`,
`resolveResponsive`, `responsiveDataAttrs`, and `popoverIsOpen` behavior
(via `useOverlay`) under happy-dom. The `check-codegen-tests` lint now
fails when `_runtime.ts` changes without a matching `_runtime.test.{ts,tsx}`
change in the same package.
