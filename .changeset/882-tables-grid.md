---
"@teseor/css": patch
---

Snap bare `<th>` / `<td>` to the `--t-unit` grid. `base.css` now sets `padding-block: var(--t-space-2)`, `padding-inline: var(--t-space-3)`, and `line-height: var(--t-leading-normal)` on cells so each row resolves to a unit-multiple at the default unit and density-scales with the rest of the spatial system.
