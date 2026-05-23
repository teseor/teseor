---
"@teseor/react": patch
"@teseor/vue": patch
---

`useOverlay` (React + Vue) now surfaces Popover API failures via the shared
`warnOnce` helper instead of swallowing the error silently. A consumer running
on a browser without Popover API support, or whose element is `display: none`,
sees one dev warning per page session per failure (`react.overlay.show-popover-failed`,
`react.overlay.hide-popover-failed`, and the Vue equivalents). No behavior
change in supported browsers.
