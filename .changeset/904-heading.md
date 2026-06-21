---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `Heading` atomic — semantic prose heading whose rendered tag (`h1`–`h6`) switches with the `level` prop via `elementByProp`. Composes with `polymorphic: 'asChild'` for native semantic outline (`<Heading level="2" asChild><a href="#anchor">Linked heading</a></Heading>`). Independent `size` prop overrides the level-derived visual scale (`<Heading level="2" size="md">` reads as h2 for screen readers but renders at the h3 visual size).

This is the first canary against the `elementByProp` substrate and surfaced two generator bugs in `gen-react/kinds/atomic.ts` — both fixed here:

- The root tag expression dropped `String(level)` widening (caused `TS7053: Element implicitly has an 'any' type`) for a typed `tagMap[level ?? <default>]` lookup that also propagates the controlling prop's `default:` value through to runtime (without the default, an omitted `level` rendered `<undefined>`).
- The widened `ref?: Ref<HTMLElement>` for elementByProp specs narrowed to `Ref<HTMLElementTagNameMap[<union of map values>]>`, restoring the precise ref type expected by the resolved tag set. The `Component` constant is annotated as `ElementType` so JSX inference accepts the union past the literal-string tags.

Vue's atomic generator emits the inline default as a single-quoted literal (`tagMap[level ?? '2']`) so the expression nests inside `v-bind`'s double-quoted attribute without HTML escaping.

Bare `<h1>`–`<h6>` inside a `.prose` container pick up the same per-level size and rhythm defaults, so Markdown headings render correctly without a wrapper.
