---
"@teseor/react": minor
"@teseor/vue": minor
---

Extend the atomic codegen so a single spec can declare both `polymorphic: 'asChild'` and `elementByProp` together, and so an `elementByProp.map` can mix HTML element types (e.g. `span | p | em` or `ul | ol`) without breaking JSX ref-type inference. Substrate change — no new component ships in this PR.

Behavior changes for the existing Heading wrapper (only consumer of `elementByProp` today):

- `ref?: Ref<HTMLElementTagNameMap["h1" | "h2" | "h3" | "h4" | "h5" | "h6"]>` widens to `ref?: Ref<HTMLElement>`. The narrower union rejected consumer refs like `<Heading asChild><a ref={anchorRef}>…` even though `asChild` is designed to accept any element; the wider type matches the polymorphism contract.
- `const Component: ElementType = asChild ? Slot : tagMap[level ?? "2"]` becomes `const Component = asChild ? Slot : asElement(tagMap[level ?? "2"])`. The runtime widener replaces the type annotation; the rendered tag and JSX output are unchanged.

`semantic-checks.ts` now accepts `polymorphic: 'asChild'` together with `elementByProp.prop: 'as'`. Free `as` polymorphism (no `elementByProp`) still conflicts with `asChild`.
