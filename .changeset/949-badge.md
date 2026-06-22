---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `Badge` atomic — small inline label for status, notification, or metadata. Renders `<span>` with token-driven color, three variants (`solid | outline | ghost`), three sizes (`sm | md | lg`), and two shapes (`rounded | pill`). Six semantic intents (`neutral | primary | success | warning | danger | info`) flow through the same `--t-badge-*` token surface. Decorative by default — no implicit role; consumers supply `aria-label` when the badge carries standalone meaning. Optional `icon` slot renders before the label inside a `[data-badge-icon]` wrapper.
