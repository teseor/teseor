---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `Radio` atomic — `<input type="radio">` with a token-driven painted center dot and `sm` / `md` / `lg` sizes. Fifth consumer of the `formControl: true` substrate. Group exclusivity is consumer-owned via the shared `name` HTML attribute (browsers handle radio-set selection natively); a composite `RadioGroup` with roving tabindex defers to a later wave (depends on #914).
