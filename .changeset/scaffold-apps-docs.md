---
---

Scaffold `apps/docs/` — the documentation site, a private Astro app that gives `gen-docs` a build target. It mounts `@teseor/css` and renders `@teseor/react` components to static HTML at build time (zero client runtime), dogfooding the design system. Internal tooling only; no consumer-facing change.
