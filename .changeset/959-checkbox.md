---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `Checkbox` atomic — `<input type="checkbox">` with a token-driven painted check / dash glyph and `sm` / `md` / `lg` sizes. Fourth consumer of the `formControl: true` substrate — `name`, `form`, `required`, `disabled` pass through via native HTML attribute fallthrough (HTML ignores `readOnly` on checkbox inputs).

Codegen substrate added:

- **`imperativeProps` on atomic spec**: JS-only DOM properties the wrapper sets after mount. Mirrors the `<input>.indeterminate` / `<details>.open` / `<video>.muted` pattern — no HTML attribute exists, so React props / Vue attribute fallthrough can't reach them. Each entry becomes a typed prop on the wrapper; React emits a `useEffect` with the consumer ref composed via `mergeRefs`, Vue emits a `watch` keyed on a template ref with `{ immediate: true, flush: "post" }`. A semantic check rejects collisions with declared spec props, the formControl shared contract, and reserved wrapper-template names. Checkbox declares `imperativeProps: { indeterminate: { type: boolean } }`.
