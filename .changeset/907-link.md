---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `Link` atomic — styled `<a>` primitive with token-driven color, hover, and visited treatment. Three variants (`default | subtle | plain`) cover standard underlined links, in-prose body-text styling that underlines on hover, and chrome-heavy contexts that drop the underline entirely. Composes with `polymorphic: 'asChild'` to wrap router links (Next/Vue Router) or other custom anchors.

Renames `Anchor` to `Link` in `specs/_vocabulary.yaml` (no Anchor spec or wrappers existed). Expands the canonical variant vocabulary to admit `subtle` and `plain`.

`external` (auto-applies `target="_blank"` + `rel="noopener noreferrer"`) is **not** in this PR — the codegen path for boolean-prop → conditional HTML attribute emission is deferred. Consumers set `target` / `rel` manually via the inherited `ComponentProps<"a">` surface.
