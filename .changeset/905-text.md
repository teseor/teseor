---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `Text` atomic — typography primitive for non-heading prose. The rendered tag switches with the `as` prop (`span | p | em | strong | small`) via `elementByProp`; `as: 'p'` engages prose-block spacing while inline tags drop margin. Composes with `polymorphic: 'asChild'` for router links or custom semantic wrappers (`<Text as="p" asChild><a href="…">Linked paragraph</a></Text>`).

Folds the legacy `Paragraph` (one component, `as: 'p'`). The canonical `variant` prop carries the semantic-color knob — `default | muted | highlight` — per the variant-vocabulary expansion landed in #925.

Bare `<p>` inside a `.prose` container picks up the same per-size and rhythm defaults, so Markdown paragraphs render correctly without a wrapper.
