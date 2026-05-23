---
"@teseor/primitives": minor
---

Scaffold `@teseor/primitives` — headless behavior package with vanilla functions and per-framework adapters under `/react` and `/vue` sub-paths. First primitive: `focus-trap`. Confines keyboard focus to a container, wraps Tab/Shift+Tab, pulls back focus that escapes the container, restores focus to the previously focused element on deactivate. Vanilla `createFocusTrap` + React `useFocusTrap` hook + Vue `useFocusTrap` composable, all built on the same underlying implementation. Portal, dismissable-layer, and anchor positioning ship in follow-up PRs against the same umbrella issue.
