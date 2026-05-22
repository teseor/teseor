---
"@teseor/css": minor
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/contract": minor
---

Add Stack and Cluster layout primitives. Stack stacks children on the block axis with `gap` (token suffix) and `align` (start/center/end/stretch), responsive across breakpoints. Cluster wraps children on the inline axis with `gap`, `align` (start/center/end/stretch/baseline), and `justify` (start/center/end/between/around), also responsive.

Generated React, Vue, and contract surfaces ship for both components, with the same DOM contract and CSS data-attribute hooks as Button. Per-component CSS bundles (`@teseor/css/components/stack.css`, `@teseor/css/components/cluster.css`) plus inclusion in the full `dist/teseor.css` entry.

Codegen pipeline hardened along the way: gen-react now narrows the ref type to the concrete HTMLElement subtype when no `as` prop is present, and emits short destructures and type intersections on a single line so generated React wrappers stay biome-clean. gen-tests no longer emits an unused `SLOT` helper for specs without slot props.
