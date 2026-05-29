---
"@teseor/contract": patch
---

Add `dom` / `dom.iterable` to the contract package's TypeScript `lib`. Event-payload builtins (`MouseEvent`, `KeyboardEvent`, `PointerEvent`, `FocusEvent`, `File`, `HTMLElement`) need DOM globals to resolve once a spec adopts an `events:` block that references them. Matches the per-package lib pattern already used by `@teseor/react` and `@teseor/vue`.
