---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `Select` atomic — native `<select>` with token-driven defaults, `outline | subtle | plain` variants and `sm / md / lg` sizes. Sixth consumer of the `formControl: true` substrate. Children are consumer-supplied `<option>` and `<optgroup>` elements; the `multiple` HTML attribute renders the native listbox via `ComponentProps<"select">` pass-through. Custom-painted comboboxes (search, async, virtual) defer to a later Combobox composite (depends on #913 floating-positioning and #915 type-ahead).
