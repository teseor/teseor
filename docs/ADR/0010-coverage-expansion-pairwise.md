# ADR-0010 — Coverage expansion: pairwise for contract fixtures

- **Status:** Proposed.
- **Deciders:** repo owner (letanure).

## Decision

The `coverage:` block (RFC 0001 § 3; issue #581) expands to a **pairwise
covering set** of fixtures, not cartesian. For Button (4 variants × 5
intents × 3 sizes = 60 cartesian), pairwise yields ~12–15 fixtures while
still exercising every (variant, intent), (variant, size), and (intent,
size) pair at least once. `constraints:` is applied **before** expansion:
forbidden cells are removed from the dimension inputs, not generated and
filtered out.

A `coverage:` block declares which dimensions vary:

```yaml
coverage:
  variant: true                      # all defined variants
  intent: true                       # all defined intents
  size: true                         # all defined sizes
  states: [disabled, loading]        # a subset of states to flip
```

Dimensions not listed are pinned at their default value.

## Why this and not the alternatives

- **Why pairwise, not cartesian.** Contract tests assert DOM byte-equality
  between framework wrappers, not visual or behavioral correctness. The
  generator emits attributes deterministically per prop; a bug manifesting
  only at a 3-way prop interaction is extremely rare in this code path.
  Pairwise covers ~90% of empirically observed defects at ~25% of the
  fixture count (Kuhn et al., NIST). Across the 70 planned components that
  compounds: cartesian projects to roughly 4,000 fixtures × 2 frameworks;
  pairwise to ~1,000 × 2. The savings are CI time and — more importantly
  — snapshot files to review whenever a spec legitimately changes.
- **Why no `mode: cartesian` opt-in.** A per-component knob is cheap to
  add and would cover a future case where 3-way interactions matter.
  Skipping it now because no such case exists — adding a knob "in case"
  is the speculative scope RFC 0001's discipline rejects. If a contract
  test ever misses a real 3-way bug, the knob lands then, with the case
  to justify it. The pairwise default is additive: a future `mode:` field
  does not break existing specs.
- **Why constraints prune before expansion, not after.** Generating
  illegal cells and filtering them out wastes covering-array slots —
  worst case, a pair is covered only by an illegal cell, which is then
  removed and the pair goes uncovered. Removing forbidden values from
  the dimension inputs first keeps the pair-coverage guarantee intact.
- **Why a hand-rolled generator, not a library.** Pairwise covering-array
  generation is a well-understood algorithm (IPOG variant or simple
  greedy) at roughly 100 lines of TypeScript. The repo is dep-frugal,
  the algorithm has no upgrade churn, and inlining the expansion in
  `gen-tests.ts` keeps the codegen pipeline self-contained.

## Consequences

- `gen-tests.ts` gains a pairwise-expansion pass that runs after the
  hand-curated `examples:` set and emits additional fixtures with IDs
  like `m-solid-primary-md`. The IDs are stable across runs (no
  hashing); regenerating the same spec produces the same fixture file.
- The hand-curated `examples:` set stays. It is the docs surface and the
  smoke-test set; the coverage expansion is test-only.
- Snapshot files multiply by roughly 8× per component over the
  hand-picked examples, not 30×. They also degrade gracefully when
  specs change: re-baselining is review-able.
- `validate-spec.ts` runs `constraints:` against every coverage cell
  (post-pruning) and against every `examples:` entry, per ADR-0009.
- A future RFC proposing `coverage: { mode: cartesian }` as an opt-in is
  unblocked: the pairwise default is additive and the field shape
  supports the extension.

## Open questions

- The exact ID scheme for coverage-generated fixtures. Working proposal:
  `cov-<dim1value>-<dim2value>-…`, stable across runs. Settled in #581's
  implementation PR.
- Whether `coverage:` is ever expanded by `gen-docs.ts`. Default: no —
  docs shows the curated `examples:` only. Confirmed in #581's PR.

## References

- [RFC 0001](../RFC/0001-v0.3-spec-format.md) § 3, § 5 — activates `coverage:`.
- [ADR-0009](0009-spec-schema-and-validation.md) — schema and validator.
- [Issue #581](https://github.com/teseor/teseor/issues/581) — `feat(codegen):
  coverage expansion in specs for combinatorial test coverage`.
