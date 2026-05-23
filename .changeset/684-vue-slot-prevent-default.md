---
"@teseor/vue": patch
---

Fix Vue `Slot` so a child handler's `event.preventDefault()` short-circuits the slot handler — React parity (PR #660). After `cloneVNode` merges `on*` handlers into `[childHandler, attrHandler]` arrays, wrap each array so the loop stops once the child sets `defaultPrevented`. Single handlers (only child or only attrs) stay as plain functions and are left untouched. Unblocks Vue composites that use `asChild` with consumer handlers that need to suppress overlay behavior.
