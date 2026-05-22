---
"@teseor/css": patch
---

Every emitted CSS file now declares the full `@layer` order up front, not just the bundle. CSS `@layer` precedence is fixed by first encounter, so loading a per-component file (`@teseor/css/components/*.css`) before — or without — the full bundle previously left the order undefined: reset rules could outrank component rules, and a component could render unstyled. The `@layer` statement is idempotent, so repeating it across files is harmless and makes the cascade independent of load order.
