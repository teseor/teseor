# @teseor/primitives

## 3.1.0

### Minor Changes

- 5d46a6b: Add the `dismissable-layer` primitive — fires `onEscapeKeyDown` and `onPointerDownOutside` callbacks so an overlay's owner can dismiss it. Layers stack: Escape fires on the topmost layer only (one tap closes one layer); pointer-down-outside fires on every layer whose element does not contain the click target (a click outside a Popover-inside-a-Modal closes both). Vanilla `createDismissableLayer` + React `useDismissableLayer` + Vue `useDismissableLayer`, all built on a shared stack. The primitive only notifies — the consumer owns the `open` state.
- 6ad4336: Scaffold `@teseor/primitives` — headless behavior package with vanilla functions and per-framework adapters under `/react` and `/vue` sub-paths. First primitive: `focus-trap`. Confines keyboard focus to a container, wraps Tab/Shift+Tab, pulls back focus that escapes the container, restores focus to the previously focused element on deactivate. Vanilla `createFocusTrap` + React `useFocusTrap` hook + Vue `useFocusTrap` composable, all built on the same underlying implementation. Portal, dismissable-layer, and anchor positioning ship in follow-up PRs against the same umbrella issue.
- 6f406ca: Add the `portal` primitive — `createPortal({ target, container })` attaches a fresh `<div>` (or a provided container) to `document.body` (or a provided target) and returns an idempotent `unmount`. Vanilla DOM only: React consumers use `createPortal` from `react-dom` directly; Vue consumers use the built-in `<Teleport>`. This vanilla layer exists for `@teseor/webc` and plain-DOM consumers.
