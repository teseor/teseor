---
"@teseor/contract": patch
"@teseor/react": patch
"@teseor/vue": patch
---

`@teseor/contract` now emits responsive prop types: a `responsive: true` prop is typed `Responsive<T>` (e.g. `block?: Responsive<boolean>`), matching what the components actually accept — previously the contract under-described every responsive prop as a flat type. The React and Vue wrappers express the same type through a shared `Responsive<T>` alias instead of an inline `T | Partial<Record<...>>` union — structurally identical, just less verbose.
