# @teseor/codegen

## 3.1.0

### Minor Changes

- be527fc: Add the `coverage:` spec block (renamed from the earlier proposal `matrix:`). `gen-tests` expands it into a pairwise covering set — every `(dim_i_value, dim_j_value)` pair across declared dimensions is exercised at least once. Constraints prune the cell set before expansion so forbidden cells never enter the candidate set; pruning evaluates constraints against the post-translation prop shape, so a `when: { loading: true }` matches a cell where a `states: "loading"` dimension translated to `{ loading: true }`. Button's coverage (`variant × intent × size`) — 60 cartesian, 47 pairs across dimensions, dropping to 17 reachable pairs after the link↔non-neutral-intent constraint — collapses to 18 stable-ID fixtures (`cov-<variant>-<intent>-<size>`) on top of the seven hand-curated examples. Duplicate fixture IDs (an example sharing an ID with a coverage cell) fail codegen with a clear error.
