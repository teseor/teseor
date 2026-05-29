---
"@teseor/contract": minor
"@teseor/react": minor
---

Wire the consumer event surface end-to-end for React Modal (RFC-0006 tracer-bullet):

- `useOverlay` exposes an optional `onDismiss(reason)` callback. Reasons: `"outside"` (pointer-down outside the floating element), `"escape"` (topmost dismissable-layer Escape), `"button"` (a `do: close` / `do: toggle` interaction that drove `open: true → false`). Fires before `onOpenChange` so consumers reading both see the semantic reason first.
- `Modal` adopts `events: dismiss` with a typed `reason` enum payload. The generated wrapper emits both a per-event `onDismiss?: (e: { reason: … }) => void` prop and the aggregated `onEvent?: (e: ModalEvent) => void` channel. Per-emission ordering: declared event prop → channel → controllable callback → channel. Each emission is its own channel call.
- `@teseor/contract` exports the `ModalEvent` discriminated union alongside `ModalProps`.

Tooltip (no events declared) is byte-identical under codegen.
