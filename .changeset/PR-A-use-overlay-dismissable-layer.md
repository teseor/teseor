---
"@teseor/react": patch
"@teseor/vue": patch
---

`useOverlay` now consumes `@teseor/primitives/dismissable-layer` — every overlay participates in the per-`ownerDocument` stack. Escape fires only on the topmost overlay (one tap closes one layer), and pointer-down outside the popover content closes the overlay. Tooltip's previous spec-level document-keydown rule is removed because it duplicated the Escape path without the stack semantics; behavior for a single Tooltip is unchanged, but Tooltip-inside-other-overlays (landing in subsequent PRs) now closes the inner layer first rather than collapsing the stack.
