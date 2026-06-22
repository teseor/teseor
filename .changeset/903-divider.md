---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `Divider` atomic — horizontal-or-vertical visual rule. Renders `<hr>` for the horizontal orientation (native `role="separator"`) and `<div role="separator" aria-orientation="vertical">` for the vertical one. The `decorative` prop removes the element from the accessibility tree (`role="none"` + `aria-hidden="true"`). Token-driven color/thickness/style/spacing-block. Supports `asChild` on the vertical branch (Slot wraps the consumer's element; the void `<hr>` branch keeps the native tag).
