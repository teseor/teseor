---
"@teseor/primitives": minor
---

Add the `dismissable-layer` primitive — fires `onEscapeKeyDown` and `onPointerDownOutside` callbacks so an overlay's owner can dismiss it. Layers stack: Escape fires on the topmost layer only (one tap closes one layer); pointer-down-outside fires on every layer whose element does not contain the click target (a click outside a Popover-inside-a-Modal closes both). Vanilla `createDismissableLayer` + React `useDismissableLayer` + Vue `useDismissableLayer`, all built on a shared stack. The primitive only notifies — the consumer owns the `open` state.
