---
"@teseor/react": patch
"@teseor/vue": patch
---

Kebab-case multi-word prop names when emitting `data-*` attributes — wrappers no longer trigger React 19 DEV warnings and CSS selectors match the DOM-canonical attribute form (`data-min-height` instead of `data-minHeight`). Single-word prop names are unchanged.
