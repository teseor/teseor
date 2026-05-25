---
"@teseor/react": patch
---

`mergeRefs` return type narrows from `void | (() => void)` to `(() => void) | undefined` — same runtime semantics (the function returns `undefined` when no consumer ref produced a cleanup, otherwise a composed cleanup), but lints clean under `noConfusingVoidType` and matches the function's actual return shape.
