---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `List` atomic — ordered / unordered list primitive. Renders `<ul>` or `<ol>` switched by the `ordered` prop via `elementByProp`. `spacing` (`compact | comfortable`) is responsive so consumers can switch density per breakpoint without a wrapper. Composes with `polymorphic: 'asChild'` for native `<ol>` pass-through (e.g. `<List ordered="true" asChild><ol start={5} type="i">…</ol></List>`).

Folds the survey's `OrderedList` and `UnorderedList` clusters into one component. Bare `<ul>` / `<ol>` inside a `.prose` container pick up the same marker-color + grid-rhythm defaults, so Markdown bullet/numbered lists render correctly without a wrapper.

`ordered` is string-typed (`"true" | "false"`) because the codegen's `elementByProp.prop` accepts string-valued controlling props only in v1. The runtime behavior matches the boolean shape the issue asked for; a future codegen extension can lift the field to a true `boolean` without breaking the spec.
