---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/contract": minor
"@teseor/css": minor
---

Add repeating-parts support to the spec layer (RFC-0005, phase 1). A `ComponentPart` may declare `repeating: true` and an optional `propName:`; codegen synthesizes an `Array<{id: string; …}>` prop on the parent and iterates it. Ships the non-navigational `Pagination` stub as the phase-1 exercise — real navigation lands with phase 3 (per-item events, native-attr passthrough).
