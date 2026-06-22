---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `Blockquote` atomic — quoted-text primitive. `default` variant ships a left accent border + prose spacing; `subtle` variant drops the border and italicises the text for compact in-prose citations. Source attribution composes via a `<cite>` child element; the native `cite` HTML attribute (URL of source) passes through the inherited type. Composes with `polymorphic: 'asChild'` for `<figure>` + `<figcaption>` patterns.
