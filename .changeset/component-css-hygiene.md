---
"@teseor/css": patch
"@teseor/react": patch
"@teseor/vue": patch
---

Component CSS/DOM hygiene. The button's spinner span renders only when `loading` — non-loading buttons no longer carry an empty `<span data-button-spinner>`. Component CSS box-sizes itself and its named parts instead of every descendant (`& *`), so a layout primitive no longer reaches into nested components; a stylelint rule (`selector-max-universal: 0`) enforces it. The loading state hides the label with `opacity: 0` instead of `visibility: hidden`, keeping it in the accessibility tree.
