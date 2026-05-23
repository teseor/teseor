---
"@teseor/primitives": minor
---

Add the `portal` primitive — `createPortal({ target, container })` attaches a fresh `<div>` (or a provided container) to `document.body` (or a provided target) and returns an idempotent `unmount`. Vanilla DOM only: React consumers use `createPortal` from `react-dom` directly; Vue consumers use the built-in `<Teleport>`. This vanilla layer exists for `@teseor/webc` and plain-DOM consumers.
