---
"@teseor/contract": patch
"@teseor/css": patch
"@teseor/react": patch
"@teseor/vue": patch
---

Refactor the codegen substrate into a plugin architecture per ADR-0025. Each declarative feature (schema fragment + check + analyze) owns one folder under `scripts/codegen/src/plugins/`; per-target generators (`gen-react-19/`, `gen-vue-3/`) own emit. A statically-typed `SpecAnalysis` carries the cross-plugin facts that used to live as ad-hoc filter logic. Cross-plugin schema fragments compose into the `Spec` type via the new core schema composer.

Two spec-shape consolidations land in the same change. Atomic `state:` renames to `latch:` (frees `state` for the parts-level state machine). The `element:` / `elementByProp:` / `polymorphic:` triad collapses into `root: { kind: "static" | "byProp", ..., polymorphic?: "asChild" }`, with polymorphism as an orthogonal optional flag inside each kind so combined byProp + asChild specs (Heading, Text, List, Divider) stay expressible.

Generated React and Vue wrapper outputs are byte-identical to main — consumer-facing APIs unchanged. The spec format is internal to the codegen pipeline; only spec authors are affected by the schema rename.
