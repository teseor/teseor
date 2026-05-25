---
"@teseor/react": minor
"@teseor/vue": minor
---

Composite wrappers (Tooltip, Modal) now expose their popover content DOM element to consumers. React: accept a `ref` prop typed `Ref<HTMLElementTagNameMap[<content>]>` and merge it with the internal `overlay.contentRef` via a new `mergeRefs` helper exported from `@teseor/<wrapper>/_runtime`. The merged ref is memoized so React doesn't see a fresh callback identity per render. Vue: call `defineExpose({ contentRef })` so `<Tooltip ref="t" />` consumers can read `t.value.contentRef.value`. Unblocks tour libraries, focus-trap composition, and intersection observers tracking popover visibility.

`@teseor/react` peer dep bumped from `>=18` to `>=19`. The atomic and composite wrappers already accept `ref` as a regular function-component prop (React 19 behavior); the prior `>=18` was an aspirational floor that the emitted code didn't honor.
