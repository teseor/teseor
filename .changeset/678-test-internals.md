---
"@teseor/react": patch
"@teseor/vue": patch
---

Internal: extract the test-only DOM polyfills into a private workspace package
`@teseor/test-internals`. Both wrapper packages now import the polyfills from
there instead of carrying byte-identical copies under `src/`. No published
behavior changes; tarballs shrink slightly (one fewer file per wrapper).
