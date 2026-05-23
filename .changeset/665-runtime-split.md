---
"@teseor/react": patch
"@teseor/vue": patch
---

Internal: split the per-package `_runtime.ts` along the gen / hand-authored
seam. `_runtime.ts` keeps the mechanical bits (responsive helpers,
`useActiveBreakpoint`, `asElement`) and stays generated. `useOverlay` moves to
hand-authored `packages/react/src/hooks/useOverlay.ts` and
`packages/vue/src/composables/useOverlay.ts`. `Slot` moves to
`packages/react/src/components/Slot.tsx` and `packages/vue/src/components/Slot.ts`.
Public API unchanged.
