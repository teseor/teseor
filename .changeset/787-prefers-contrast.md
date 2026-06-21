---
"@teseor/css": minor
---

Add opt-in `@teseor/css/prefers-contrast.css` preset. Consumers who import the file get a `@media (prefers-contrast: more)` branch that re-aliases `--t-fg`, `--t-border`, `--t-border-strong`, `--t-focus-ring`, and `--t-accent` to denser steps on the existing scale. Default `teseor.css` is unchanged.
