# @teseor/test-internals

Test-only helpers shared across the wrapper packages. Private — never
published.

## What's here

- `dom-polyfills.ts` — controllable stand-ins for the surfaces `_runtime.ts`
  touches under happy-dom (Popover API, `:popover-open`, matchMedia, CSS.supports).
  Used by `_runtime.test.{ts,tsx}` in `@teseor/react` and `@teseor/vue`.

## Why a package, not a copied file

The polyfills have evolved through every Copilot round on PR #677 — five
identical edits across two packages before this extraction. One source of
truth means future fixes land once.
