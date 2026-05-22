---
---

gen-tests now emits one combined DOM snapshot per spec instead of one file per fixture, and extracts the shared Playwright contract logic into a generated `tests/contract/_contract.ts` harness. Each `<spec>.spec.ts` shrinks to a `defineContractTests(...)` call; the combined snapshot lands at `<spec>.spec.ts-snapshots/<spec>.html` with every fixture's canonical DOM in labeled `<!-- id -->` sections. Cross-framework React-vs-Vue equality assertions stay per-fixture, preserving failure granularity. Internal test infrastructure only; no consumer-facing change.
