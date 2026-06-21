---
"@teseor/css": minor
---

Register `--t-unit` via `@property` (`<length>` syntax, inherits, initial-value `0.25rem`). Non-length overrides now fall back to the initial value instead of corrupting every derived token, and `transition: --t-unit ...` becomes meaningful so density toggles can animate spacing and sizing in lockstep.
