---
"@teseor/react": minor
"@teseor/vue": minor
---

Atomic specs (and composite parts, via schema) may now declare `elementByProp: { prop, map }` to switch the rendered HTML tag at runtime based on a controlling prop's value. The React and Vue atomic generators emit a `tagMap` constant and resolve the root element via the prop. Wave 1 components Heading (`level: '1'..'6'` → `h1..h6`) and Text (`as: 'span' | 'p' | …`) consume this directly. List's boolean-driven case (`ordered → ol|ul`) is out of scope here — handled on the spec PR.

A semantic check enforces: `elementByProp` and `element` are mutually exclusive; the controlling prop must exist on the same node with `type: 'string'`; the map's keys and the prop's `values:` must match exactly. `elementByProp` composes with `polymorphic: 'asChild'` — asChild wins when true, otherwise the prop drives the tag.

The docs prop-table row for the controlling prop appends `Renders as <h1> for 1, <h2> for 2, …` so consumers see the mapping inline. No existing wrapper changes; every shipped spec stays opted out.
