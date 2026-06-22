---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `Switch` atomic — `<input type="checkbox" role="switch">` with a token-driven sliding thumb and `sm` / `md` / `lg` sizes. Third consumer of the `formControl: true` substrate — `name`, `form`, `required`, `disabled` pass through via native HTML attribute fallthrough (HTML ignores `readOnly` on checkbox inputs).

Codegen substrate fix folded in:

- **`htmlAttrs` on atomic spec**: static HTML attributes that bake onto the root element after the consumer-prop spread, so the component contract can't be overridden. Switch declares `htmlAttrs: { type: "checkbox" }`; future Checkbox / Radio will use the same field. React emits each entry as a literal JSX attribute; Vue emits each entry in the `attrs` computed object (literal v-bind merge rules lock the value). The role-specific Biome ignore (`<input type="checkbox" role="switch">` triggers `useAriaPropsForRole` because Biome can't see the implicit `aria-checked`) is now placed inline directly above the offending `role=` line via a new optional parameter on `renderA11yAttrs`.
