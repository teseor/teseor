---
"@teseor/react": patch
"@teseor/vue": patch
---

`useOverlay` now consumes `@teseor/primitives/dismissable-layer` — every overlay participates in the per-`ownerDocument` stack. Escape fires only on the topmost overlay (one tap closes one layer), and pointer-down outside the popover content closes the overlay. Tooltip's previous spec-level document-keydown rule is removed because it duplicated the Escape path without the stack semantics; single-Tooltip behavior is unchanged, but Tooltip-inside-other-overlays (landing in subsequent PRs) now closes the inner layer first rather than collapsing the stack. The layer wiring is unconditional — Escape and outside-pointer close the overlay regardless of `disabled` at the current breakpoint; previously Tooltip's spec-level Escape rule went through the disabled-gated `schedule()`, so a `disabled: true` overlay could not be Escape-closed.
