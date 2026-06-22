---
"@teseor/react": minor
"@teseor/vue": minor
---

Atomic codegen now emits `role`, `aria-{prop}` (per `spec.a11y.ariaProps`), and a `decorativeProp`-driven `aria-hidden` / `role="none"` toggle from the spec's `a11y` block. Existing specs with `a11y.role` (`Button`) gain a static `role` attr on the rendered root. `Cluster` and `Stack` drop their docs-only `role: generic` entries.
