---
"@teseor/contract": minor
"@teseor/react": minor
"@teseor/vue": minor
---

Constrain the polymorphic `as` prop to a closed set of element names. Button's `as` is now typed `"button" | "a"` across `@teseor/contract`, `@teseor/react`, and `@teseor/vue` instead of `string` / `ElementType`. Custom React components are intentionally not allowed — the `as` prop is a semantic element swap; wrapping-around-X composition stays a `dependencies:` / `parts:` concern. The validator (`pnpm lint:spec`) rejects an `as` prop that omits `values:`.
