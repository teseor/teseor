---
---

Bring stack and cluster up to the v0.3 spec format. Both gain explicit `a11y: { role: generic }` and a `coverage:` block so the contract suite catches DOM drift on every `align`/`justify` value, not only the curated `examples:`. No public package surface changes — internal specs, generated harness fixtures, and contract snapshots only.
