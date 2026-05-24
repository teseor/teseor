---
"@teseor/primitives": minor
"@teseor/react": minor
"@teseor/vue": minor
---

Overlay modality. `overlay.modal: true` on a spec activates three runtime pieces gated on a single flag: a focus trap on the content node, a body-children inert cascade (new `@teseor/primitives/modality` primitive — per-`ownerDocument` stack, restores cleanly on close), and a body-level portal (React `createPortal`, Vue `<Teleport to="body">`) so the inert target set is well-defined. Modal ships as the first consumer. Tooltip-on-Modal-trigger degrades naturally — the trigger sits under an inert ancestor and can't fire `focus` / `mouseover`, so the Tooltip stays closed without any special-case logic.
