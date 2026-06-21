---
"@teseor/react": minor
"@teseor/vue": minor
---

Atomic specs may now opt into `asChild`-based polymorphism via the new `polymorphic: 'asChild'` field. When set, the generator adds an `asChild?: boolean` prop and renders via the shared `Slot` helper instead of the spec's root element when `asChild={true}`. The Slot components themselves are unchanged — this PR extends the schema and atomic React / Vue generators so any Wave 1 atomic component (Divider, Heading, Text, List, Link, Blockquote, Image, Kbd) can opt in by declaring `polymorphic: 'asChild'` in its spec.

A semantic check rejects `polymorphic` alongside a sibling `as` prop (mutually exclusive polymorphism strategies) and on void-element roots (Slot needs a child to clone into). The docs prop table auto-emits the `asChild` row for any atomic spec that opts in, matching the existing composite-trigger row.

No existing wrapper changes — every shipped spec stays opted out, so the generated React and Vue outputs are byte-identical to main.
