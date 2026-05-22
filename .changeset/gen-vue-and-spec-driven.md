---
"@teseor/vue": minor
"@teseor/react": patch
"@teseor/contract": patch
---

Add @teseor/vue: Vue 3 wrappers generated from the same specs as @teseor/react. Same data-attribute surface, same CSS, identical rendered DOM.

Refactor the React generator to be fully spec-driven. Slots, label-wrap, spinner, disabled/aria-disabled, polymorphic root, and data-attr prefixes all derive from spec contents instead of hardcoded component names. Button output is byte-identical after the refactor.

Generated component files now include a JSDoc block with the description (from `spec.description`) and a first-example snippet (from `spec.examples[0]`), so IDE hover shows the component description before the expanded type signature.

Add `examples` and `element` fields to the Spec type (already used in committed specs; now formally typed).
