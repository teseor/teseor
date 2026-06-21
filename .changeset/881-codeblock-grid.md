---
"@teseor/css": patch
---

Codeblock now snaps `line-height` to the `--t-unit` grid via `--t-leading-normal` instead of the raw `1.5` ratio. With the default `font-size: 0.875rem` (14px), this raises rendered line height from 21px to 24px so each `pre.t-codeblock` lands on the 4px vertical rhythm grid.
