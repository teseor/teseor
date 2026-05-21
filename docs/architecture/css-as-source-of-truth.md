# CSS as source of truth

The handwritten CSS file *is* the component. Framework wrappers (React, Vue, Svelte, Angular, web-components) are codegen output. Docs HTML is codegen output. TypeScript types are codegen output. The CSS is the only thing humans author for a component's runtime behavior.

## Why this direction

The alternative — author components in React, ship CSS-in-JS or extracted stylesheets — couples three concerns we want separated: visual contract, framework binding, and component logic. CSS-first inverts that:

- **Visual contract is CSS.** Class names, custom properties, and `data-*` attributes are the API. They don't change when React 19 ships or Vue's reactivity changes shape.
- **Framework binding is generated.** A React wrapper exists to pass props through, manage refs, and handle event types. It does not own state or styling.
- **Component logic** (focus-trap inside Modal, roving tabindex inside Tabs) lives in `@teseor/primitives` and is consumed by every wrapper identically.

The cost is upfront: codegen has to be real before more than one wrapper exists. The payoff is that adding a sixth framework target (Qwik, Solid, SwiftUI host…) is a new generator script, not a re-implementation of the design system.

## Per-component artifacts

```
packages/css/src/components/button/
├── button.css            # handwritten — source of truth
└── button.visual.spec.ts # handwritten — Playwright visual baseline

specs/button.yaml         # handwritten — describes the API surface

packages/react/src/Button.tsx   # generated from specs/button.yaml
packages/vue/src/Button.vue     # generated
packages/svelte/src/Button.svelte
packages/angular/src/Button.ts
packages/webc/src/t-button.ts
packages/contract/src/Button.ts # generated TS types
apps/docs/src/components/button/index.html # generated
```

Generated files are committed to the repo (so consumers see them, CI can diff them) but they live under directories the linter treats as read-only: editing `Button.tsx` directly fails the `generated-file-not-edited` lint.

## What goes where

| Concern | Lives in | Why |
| --- | --- | --- |
| Visual styling | `button.css` | Direct, lintable, performance-budgeted |
| Layout primitives (focus-ring, portal, focus-trap) | `@teseor/primitives` | Shared across components and wrappers |
| Props, slots, events, intents, sizes | `specs/button.yaml` | One source for all framework wrappers |
| Token contract | `button.css` (declares `--t-button-*`) + `specs/button.yaml` (lists them) | The CSS publishes them; the spec catalogs them |
| Accessibility (keyboard map, ARIA) | `specs/button.yaml` (`a11y` block) | Codegen wires it into wrappers and tests |
| Composition recipes ("how to build a Card with an Avatar") | `docs/recipes/` | Documentation, not components |

## Hard consequences

- **You cannot publish a wrapper without a CSS file.** No paper components.
- **You cannot change a public class name without a major version bump.** Class names are API (rule 9 in `rules/hard-rules.md`).
- **CI fails if generated files drift from their sources.** Drift means somebody edited the wrong file. See `process/ci-gates.md`.
- **Wrappers cannot import other wrappers.** A React Button doesn't import a React Icon — both are independent codegen outputs from the same spec layer.


