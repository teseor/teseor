---
"@teseor/css": patch
---

Snap inline `<Code>` line-boxes to the `--t-unit` grid. Force `line-height: 1` on `.t-code` so the monospace strut doesn't push parent line-boxes beyond the rhythm, and floor the block-size to `--t-row-1` so the element still lands on grid when it ends up as the sole child of a flex / grid container.
