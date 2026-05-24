---
"@teseor/react": patch
"@teseor/vue": patch
---

Generated README text now points consumers at `tests/contract/<name>.spec.ts` (the actual location of cross-framework contract tests) instead of the stale `tests/<name>/` placeholder. README content is the only `packages/` change in this codegen reorg PR; wrapper output is byte-identical to main.
