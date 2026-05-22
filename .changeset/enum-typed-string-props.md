---
"@teseor/contract": minor
"@teseor/react": minor
"@teseor/vue": minor
---

Spec props can now declare `values:` — a closed set of accepted strings. `gen-contract`, `gen-react`, and `gen-vue` emit a typed union (e.g. `StackAlign = "start" | "center" | "end" | "stretch"`) and type the prop with it instead of bare `string`, so invalid values are caught at the call site. `Stack`'s `align` and `Cluster`'s `align` / `justify` now ship as typed unions; open-set props like `gap` stay `string`.
