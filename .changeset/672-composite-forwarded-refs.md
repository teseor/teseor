---
"@teseor/react": minor
"@teseor/vue": minor
---

Composite wrappers (Tooltip, Modal) now expose their popover content DOM element to consumers. React: accept a `ref` prop typed `Ref<HTMLElementTagNameMap[<content>]>` and merge it with the internal `overlay.contentRef` via a new `mergeRefs` helper exported from `@teseor/<wrapper>/_runtime`. Vue: call `defineExpose({ contentRef })` so `<Tooltip ref="t" />` consumers can read `t.value.contentRef.value`. Unblocks tour libraries, focus-trap composition, and intersection observers tracking popover visibility.
