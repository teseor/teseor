---
---

gen-tests now emits one combined DOM snapshot per spec instead of one file per fixture. Each spec's `<spec>.spec.ts-snapshots/<spec>.html` holds every fixture's canonical DOM in labeled `<!-- id -->` sections. Cross-framework React-vs-Vue equality assertions stay per-fixture, preserving failure granularity. Internal test infrastructure only; no consumer-facing change.
