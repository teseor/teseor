---
"@teseor/react": patch
"@teseor/vue": patch
---

`useOverlay` now consumes `@teseor/primitives/dismissable-layer` — every overlay participates in the per-`ownerDocument` stack. Escape fires only on the topmost overlay (one tap closes one layer), and pointer-down outside the popover content closes the overlay. Tooltip's previous spec-level document-keydown rule is removed because it duplicated the Escape path without the stack semantics. Tooltip also now closes on any pointer-down outside the tooltip content — including a tap on the trigger itself — via the new dismissable-layer wiring; previously Tooltip closed only on `mouseleave` / `focusout` / Escape. The common hover path masks this in practice, but keyboard / touch flows surface it as a faster close. Tooltip-inside-other-overlays (landing in subsequent PRs) now closes the inner layer first rather than collapsing the stack. The layer wiring is unconditional — Escape and outside-pointer close the overlay regardless of `disabled` at the current breakpoint; previously Tooltip's spec-level Escape rule went through the disabled-gated `schedule()`, so a `disabled: true` overlay could not be Escape-closed.
