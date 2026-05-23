---
"@teseor/primitives": minor
"@teseor/react": patch
"@teseor/vue": patch
---

Add `warnOnce(key, message)` to `@teseor/primitives` — a shared helper for
deduplicated dev warnings. Logs once per key, prefixed `[teseor] `, SSR-safe,
no-op when `console` is undefined. Browser dedup state lives on
`window.__teseor_warned` (a `Set<string>`) so test suites can reset it between
cases. `Slot` (React + Vue) now calls `warnOnce` instead of inline
`console.warn` blocks.
