---
"@teseor/codegen": minor
---

Add the `matrix:` spec block. `gen-tests` expands it into a pairwise covering set (per the matrix-expansion ADR) — every `(dim_i_value, dim_j_value)` pair is exercised at least once across the generated fixtures. Constraints prune the cell set before expansion so forbidden cells never enter the candidate set. Button's matrix (`variant × intent × size` = 60 cartesian, 17 reachable after the link-vs-non-neutral constraint) collapses to 18 stable-ID matrix fixtures (`m-<variant>-<intent>-<size>`) on top of the seven hand-curated examples.
