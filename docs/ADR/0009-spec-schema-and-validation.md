# ADR-0009 — Spec schema and validation

- **Status:** Proposed.
- **Deciders:** repo owner (letanure).

## Decision

The v0.3 `specs/<name>.yaml` format is an **identity layer** plus a **recursive
`ComponentNode`**, gated by an open `kind:` discriminated union (`atomic`,
`composite`, with room for a future kind). Atomic specs inline the node flat at
the root (today's shape, unchanged); composite specs carry a `parts:` map of
`ComponentNode`s, each of which may itself carry `parts:` — a part is a
component node, recursively. Validation runs in a real `validate-spec.ts`
(replacing the current `lint:spec` no-op stub), in two layers: a **Zod schema**
enforces shape and rejects unknown fields, and a hand-rolled semantic pass
cross-checks the spec against the component CSS, the `examples:` entries, the
`matrix:` cells, and the vocabulary.

The full design and its alternatives are recorded in
[RFC 0001](../RFC/0001-v0.3-spec-format.md).

## Why this and not the alternatives

- **A real validator, not a stub.** `architecture/codegen-pipeline.md`
  describes a validator and a "frozen schema that rejects unknown fields";
  neither exists. The spec-to-CSS token contract is the deepest drift risk in
  the codebase. The validator is the only place that contract gets enforced.
- **Identity / `ComponentNode` split.** A part *is* the same structural unit
  as a component — an element with styling, optionally nested. The identity
  layer (`name`, `kind`, `examples`, `matrix`, `guidance`, `dependencies`) is
  meaningless for a sub-part. Splitting them lets one recursive sub-schema
  cover atomic specs and parts of any depth.
- **Open `kind:` discriminator.** The full component inventory shows a third
  kind is coming (form composition: `Field` wiring `for` / `aria-describedby`
  across independent children). A closed `atomic | composite` union would
  force a breaking schema change later. Keeping the discriminator open costs
  nothing now.
- **Atomic stays flat.** ~60 of the planned components are single-element
  atoms. Forcing them under a `parts: { root: ... }` wrapper pays nesting
  cost 60 times for internal uniformity. The discriminated union is the
  right uniformity boundary: same `ComponentNode` schema validates both
  shapes; *authoring* stays flat for atoms.
- **Zod for the shape layer.** POC-confirmed: `z.lazy()` handles the
  recursion, strict objects reject unknown fields, `z.discriminatedUnion`
  covers `kind:`. `z.infer` gives the generators a single typed spec model
  (today each generator hand-maintains its own `Spec` types). Valibot and a
  hand-rolled validator would each work; Zod is the lowest-friction default
  for a TS codebase already running Biome and strict TypeScript, and ADR-0002
  already named it. The semantic-check pass is hand-rolled regardless — Zod
  cannot express cross-file checks.

## Consequences

- `lint:spec` becomes a real check. Specs with unknown fields, missing
  required fields, or token contracts that disagree with the CSS fail
  locally and in CI.
- One spec migration: `button.yaml` `states:` from a list to a map. No
  consumer impact (the spec is repo-internal).
- One new dependency (Zod). The semantic-check pass adds a new TypeScript
  file under `scripts/codegen/src/`.
- The recursive shape commits to a structure now; depth-2+ codegen is
  unverified until `Table` lands (v0.5). The schema is closed under
  composition by construction, so no schema change is foreseen — but the
  codegen depth might surface edges.
- `architecture/codegen-pipeline.md` is corrected in the validator-keystone
  PR to describe the validator as built. ADR-0002's stale spec-shape example
  (variants as a list) is corrected in the same PR — an in-place factual
  correction per `docs/ADR/README.md`.
- The schema-library choice is recorded. Future spec-format work uses Zod
  for the shape layer; a future RFC arguing for a switch carries the
  migration cost.

## Open questions

- Whether `motion:` is required (see RFC 0001 § Unresolved questions).
- The composite `examples:` shape — per-part prop addressing (RFC 0001).
- `guidance:` YAML shape (RFC 0001).

## References

- [RFC 0001](../RFC/0001-v0.3-spec-format.md) — The v0.3 spec format.
- [ADR-0002](0002-per-component-yaml-over-manifest.md) — Per-component YAML
  over monolithic manifest. This ADR extends 0002.
- [Issue #635](https://github.com/teseor/teseor/issues/635) — `docs(spec):
  decide the v0.3 spec-format`.
