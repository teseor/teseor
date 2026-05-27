---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/contract": minor
"@teseor/css": minor
---

Add `groupKey:` to the spec layer (RFC-0005). Two or more repeating parts that share a `groupKey:` iterate the same synthesized array prop and codegen-interleave into a single loop — one element of each part emitted per iteration step. Group-level scalar props on the non-repeating wrapper part now flow through the wrapper element (rule 11 lifted). Ships the non-interactive `TabsList` stub (one tab button + optional adjacent icon per item) as the end-to-end exercise.
