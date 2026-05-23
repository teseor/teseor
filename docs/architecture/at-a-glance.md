# Architecture at a glance

One page for "what exists today" versus "what the architecture is designed to
grow into".

## Canonical flow

```text
specs/*.yaml + packages/css/src/** + docs/**
            │
            ├── scripts/codegen/          → wrappers, contract types, docs data, tests
            ├── packages/css build        → published CSS bundles
            └── CI gates                  → drift, correctness, size, docs, discipline
```

## Layer and package map

| Area | Source of truth | Status today | Notes |
| --- | --- | --- | --- |
| `specs/` | Handwritten YAML specs | **Implemented** | Public API contract for wrappers, docs, and tests |
| `packages/css/` | Handwritten CSS | **Implemented** | Runtime styling source of truth |
| `scripts/codegen/` | TypeScript generators + validators | **Implemented** | Generates wrappers, docs data, contract types, and tests |
| `packages/react/` | Generated wrappers + generated runtime | **Implemented** | Current first-class wrapper target |
| `packages/vue/` | Generated wrappers + generated runtime | **Implemented** | Current first-class wrapper target |
| `packages/contract/` | Generated TypeScript surface | **Implemented** | Consumer-facing contract/types output |
| `apps/docs/` | Astro site + generated docs data | **Implemented** | Dogfoods the design system |
| `apps/harness/` | Private test app | **Implemented** | Used by Playwright contract tests |
| `apps/preview/` | Private preview app | **Implemented** | Local manual iteration surface |
| `tests/contract/` | Generated Playwright specs + snapshots | **Implemented** | Cross-framework DOM-parity gate |
| `packages/primitives/` | Shared behavior utilities | **Partially implemented** | Package exists; broader primitive surface continues to land with overlay/stateful work |
| `themes/` | Token-only CSS theme files | **Planned** | Theme model is designed/documented; folder and lint enforcement are not landed yet |
| `packages/svelte/` | Generated wrappers | **Planned** | Target is designed in docs, not shipped yet |
| `packages/angular/` | Generated wrappers | **Planned** | Target is designed in docs, not shipped yet |
| `packages/webc/` | Generated web components | **Planned** | Target is designed in docs, not shipped yet |

## What contributors should assume today

- CSS is the runtime source of truth.
- Specs are the public contract source of truth.
- React and Vue are the only active wrapper targets in the repo today.
- Codegen, docs, and tests are real and enforced now.
- Themes, additional wrapper targets, and some later-milestone schema fields are
  documented ahead of implementation.

## Read next

- `docs/architecture/css-as-source-of-truth.md`
- `docs/architecture/codegen-pipeline.md`
- `docs/process/ci-gates.md`
- `docs/process/contribution-paths.md`
- `docs/process/architecture-health.md`
