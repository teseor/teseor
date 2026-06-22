---
"@teseor/css": minor
"@teseor/react": minor
"@teseor/vue": minor
---

Add `Avatar` atomic primitive with image → initials → empty-fallback chain. Introduces two orthogonal codegen substrate fields for the conditional-render pattern: `state:` (declares internal `useState`/`ref` variables) and `branches:` (ordered conditional subtrees with object-form `when` clauses, prop-or-state-driven `attrs`, and a `compute:` text path backed by `deriveInitials` in the runtime). Existing specs produce identical output.
