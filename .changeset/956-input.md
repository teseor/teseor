---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `Input` atomic — styled `<input>` with token-driven defaults, `outline` / `subtle` / `plain` visual variants, and `sm` / `md` / `lg` sizes. The `invalid` prop emits `data-invalid="true"` for styling; ARIA wiring is consumer-supplied. First atom on the `formControl: true` substrate — `name`, `form`, `required`, `readOnly`, `disabled` reach the rendered `<input>` via native HTML attribute fallthrough. The native `type` attribute (`text`, `email`, `number`, `tel`, `url`, `search`, `password`) inherits from `ComponentProps<"input">`.
