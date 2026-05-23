---
"@teseor/css": minor
"@teseor/contract": minor
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/docs": patch
---

Add Tooltip — the first composite-spec component and first CSS Anchor Positioning + Popover API consumer. Spec-driven wrapper generation; behavior is declared in the spec via the new `interactions:` and `popover:` blocks.

Spec language additions:

- `kind: composite` specs now flow through every generator (contract, React, docs). Composite props/tokens/states are merged into a single component API via `flattenSpec`.
- `interactions:` declares event → state-change rules (target part / document / window, optional delay, optional state guard) consumed by a shared `useOverlay` runtime hook.
- `popover:` declares overlay binding (anchor part, floating part, popover mode, anchor custom-ident).
- `parts.<name>.fromChildren: true` marks a part rendered as a wrapper around the consumer's children (no `cloneElement` — works in pure-React and Astro slots).
- `pattern: controllable` on a boolean prop now expands to the `open` / `defaultOpen` / `onOpenChange` triple.

`@teseor/css` ships `t-tooltip-trigger` + `t-tooltip` with placement variants and `@starting-style` entry animation. Both `@teseor/react` and `@teseor/vue` ship Tooltip together — Vue gets a mirrored `useOverlay` composable in `_runtime.ts` and a generated `Tooltip.vue` SFC.
