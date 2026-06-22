---
"@teseor/react": minor
"@teseor/vue": minor
"@teseor/css": minor
"@teseor/contract": minor
---

Add `Image` atomic — styled `<img>` primitive with token-driven corner radius and loading-state background. Native HTML attributes (`src`, `alt`, `width`, `height`, `loading`, `decoding`, `srcset`, `sizes`) pass through the inherited type. Optional `fit` prop maps to `object-fit` and accepts a responsive form (`{ base, sm, md, … }`) for art-direction without `<picture>`. `asChild` is deferred (Slot on a void element); `loading: 'lazy'` and `decoding: 'async'` defaults are deferred to consumer choice (set via the native attrs).
