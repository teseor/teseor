# ADR-0015 — Codegen layout: target-first generators with kinds/components/workspace + shared lib

- **Status:** Accepted.
- **Deciders:** repo owner (letanure).

## Decision

Reorganize `scripts/codegen/src/generators/` from one monolithic file per
generator into a target-first directory structure. Each generator
(`gen-react`, `gen-vue`, `gen-contract`, `gen-docs`, `gen-tests`) keeps its
top-level dispatcher file (`gen-<target>.ts`) and grows a sibling directory
(`gen-<target>/`) containing its split internals. Framework-agnostic helpers
shared across two or more generators move to `scripts/codegen/src/lib/`.

```text
scripts/codegen/src/
├── cli.ts                                # unchanged
├── registry.ts                           # unchanged — one entry per generator
├── generators/
│   ├── index.ts                          # unchanged (side-effect imports)
│   ├── gen-contract.ts                   # thin dispatcher
│   ├── gen-docs.ts                       # thin dispatcher
│   ├── gen-react.ts                      # thin dispatcher
│   ├── gen-tests.ts                      # thin dispatcher
│   ├── gen-vue.ts                        # thin dispatcher
│   └── gen-<target>/
│       ├── kinds/                        # per-spec.kind templates
│       │   ├── atomic.ts
│       │   └── composite-overlay.ts
│       ├── components/                   # per-component, when shared kind doesn't fit
│       │   └── (e.g. date-picker.ts when DatePicker lands)
│       ├── workspace/                    # workspace-wide emitters (barrels, READMEs)
│       └── \_shared/                      # framework-specific helpers
└── lib/                                  # cross-target, framework-agnostic helpers
```

Each `gen-<target>.ts` becomes a ~50-line dispatcher: imports, `registerGenerator`
call, branch on `spec.kind` (or route to `components/<name>` for named
exceptions). The rendering logic moves into the per-target subdirectories.

The generator-level registry (`registerGenerator("react", fn)` and its four
siblings) is preserved unchanged. No per-emitter registry layer is introduced.

## The five buckets

| Bucket | Holds | Triggered for |
| --- | --- | --- |
| `gen-<target>/kinds/<kind>.ts` | Template shared by every spec of that kind | All specs where `spec.kind === <kind>` |
| `gen-<target>/components/<name>.ts` | Full per-component emitter for genuinely unique components (DatePicker, DataGrid, Tree, ColorPicker) that don't slice into shared kinds | The named spec only |
| `gen-<target>/workspace/<file>.ts` | Aggregate emitters that take the full spec corpus (barrels, READMEs, framework-wide runtime files) | Once per `pnpm gen` invocation |
| `gen-<target>/\_shared/` | Framework-specific helpers used by ≥2 files inside the same target dir (JSX printer, SFC printer, hook-config) | Imported by the per-target files that need them |
| `scripts/codegen/src/lib/` | Cross-target helpers used by ≥2 generators (pascal-case, text-escape, collect-slots, enum-primitives, jsdoc-shape, composite-shape, flatten) | Imported anywhere across `scripts/codegen/` |

lib/ does not depend on generators/. Per-target \_shared/ does not depend
on other targets' \_shared/. Generator dispatchers depend on lib/, their own
\_shared/, and their own kinds/components/workspace/.

## Why this and not the alternatives

- **Not "literal parts/ split per generator" (the issue's first sketch).**
  A per-generator parts/ folder with `render-props.ts`, `render-runtime.ts`,
  `render-wrapper-{atomic,composite}.ts` makes sense at three composites total,
  but doesn't scale: the wrapper file accumulates a branch per new spec kind
  (form-control, list, statechart) until it's the old monolith with extra
  steps. Kinds-as-folders fixes the failure mode at the file level — adding a
  new kind drops a new file in kinds/ and never grows existing kind files.

- **Not "kind-first" (`kinds/<kind>/{react,vue,contract,...}.ts`).**
  Kind-first prevents per-target shape drift structurally (the React atomic
  template and Vue atomic template sit next to each other). But it loses the
  "open gen-react/ for everything React" mental model that this codebase
  already had with the monolithic `gen-react.ts`. Navigability beats structural
  enforcement here; cross-target shape parity is caught by the
  cross-framework DOM-parity contract tests under `tests/contract/`, not by
  directory layout.

- **Not a per-emitter registry layer modelled on ADR-0014.** The lint runner's
  registry exists because rules are independently invokable from CI, are
  heterogeneous (file/workspace/diff-aware/external), and discoverability is
  part of the workflow (`--list`). Codegen has none of these properties: every
  `pnpm gen` runs all generators together, emitters are homogeneous, and the
  spec-to-file mapping is the discovery surface. Adding a second registry tier
  solves no debug workflow that exists. The generator-level registry stays;
  emitter-level dispatch is plain TypeScript inside each generator. If `#745`
  (plugin API) or `#748` (JSON Schema artifact) later need a programmatic
  emitter catalog, the migration from "internal dispatch" to "registered
  emitters" is mechanical — easier to add later than to undo if added now.

- **Not "components/ as an escape hatch."** Component-specific emitters
  (DatePicker, DataGrid, Tree) are first-class, not last-resort. Forcing
  components with genuinely unique shape into a shared kind template either
  invents a kind-of-one or pollutes the kind with branches that fire for one
  component. `gen-<target>/components/<name>.ts` is the right home for that
  category from the start.

- **Not "extract every helper to lib/ upfront."** Helpers move to lib/
  only when ≥2 generators (or ≥2 per-target files) share them. Premature
  promotion creates an awkward middle layer of pseudo-shared code that's hard
  to extend. Stage-1 of the refactor extracted six clearly-duplicated helpers
  (pascal-case, text-escape, collect-slots, enum-primitives, jsdoc-shape,
  composite-shape) and deferred the rest until the per-generator split surfaces
  the actual shared surface.

## Consequences

- **Byte-identical contract.** The refactor is structural only. `pnpm gen`
  produces no diff at every commit; CI's `gen-drift` job is the backstop. No
  behavior change ships in this PR — feature work (#582 behavior tests,
  visual-parity tests, #593 enum-type exports) lands separately on the new
  shape.
- **Adding a new target (#584 webc, #674 astro, #723 email/pdf) is a new
  `gen-<target>/` directory** with the same `kinds/components/workspace/_shared`
  shape. Other generators are not touched. The target's registration is one
  new entry in `gen-<target>.ts` calling `registerGenerator`.
- **Adding a new spec.kind (#693 form-control, #687 list, future statechart)
  touches every `gen-<target>/kinds/` dir** to add the new kind file. That's a
  coordinated change, but it has to happen anyway — a new kind has to be
  teachable across all output targets.
- **Cross-target shape parity becomes discipline + contract tests.** With
  target-first, the React atomic template and the Vue atomic template don't
  live next to each other. Drift is caught by `tests/contract/<name>.spec.ts`
  (DOM-parity across frameworks), not by directory layout. Promotion of
  genuinely shared patterns into lib/ reduces the surface where drift can
  hide.
- **The five generator files (`gen-<target>.ts`) shrink from 300–1000 LOC each
  to ~50 LOC.** They become thin orchestrators: import the kind/component
  emitters, dispatch on `spec.kind`, register with the generator registry.
- **`scripts/codegen/src/lib/` has six new modules** with colocated unit
  tests: `pascal-case.ts`, `text-escape.ts`, `collect-slots.ts`,
  `enum-primitives.ts`, `jsdoc-shape.ts`, `composite-shape.ts`. Each is a
  pure framework-agnostic primitive imported by multiple generators.
- **`composite-shape.ts` carries per-emitter options** because React and Vue
  composite emitters diverge on a few validation rules (React forbids
  `floating.fromChildren === true`; Vue does not). Parameterized via a
  `CompositeShapeOptions` flags object rather than two separate functions —
  documents the asymmetry explicitly.

## When this gets revisited

- **`components/<name>/` swallows the design.** If real-world components turn
  out to be mostly unique (DatePicker-class), most additions land in
  components/ and the kind axis stops doing work. Watch the ratio after
  4-5 new components ship. If components/ exceeds ~50% of new entries, the
  spec abstraction is failing — separate decision required, not part of this
  ADR.
- **A spec belongs to two kinds at once** (e.g., Combobox blends
  composite-overlay with form-control). Today `spec.kind` is single-valued;
  future composability requires either a multi-valued `spec.kinds: [...]`
  schema change with a dispatcher that fires multiple kind emitters, or
  per-component handling. Schema decision belongs to the spec-evolution
  stream, not this layout ADR.
- **The plugin API (#745) needs to register emitters from outside `scripts/
  codegen/`.** Today the generator registry is internal-only. Adding a
  programmatic emitter registry on top would unblock plugins. Tracked as
  follow-up; not in scope here.
- **Per-target \_shared/ becomes a duplicate of another target's \_shared/.**
  If gen-react's framework-specific jsx printer and an analogous gen-astro file
  end up with substantially shared logic, promote to a framework-aware module
  under `scripts/codegen/src/lib/` (e.g. a per-target subdirectory). The threshold is "≥2 targets actually share this code,"
  not speculation.

## References

- [#671](https://github.com/teseor/teseor/issues/671) — codegen reorg (this
  PR closes it)
- [ADR-0014](0014-scripts-layout-and-lint-runner.md) — direct precedent for
  scripts-subsystem reorg via role-based subdirectories; ADR-0015 follows the
  same shape inside `scripts/codegen/`
- [ADR-0002](0002-per-component-yaml-over-manifest.md) — per-component spec as
  the source of truth that codegen consumes
- [ADR-0009](0009-spec-schema-and-validation.md) — the spec schema that
  generators read; `spec.kind` is the load-bearing field this layout's
  kinds/ axis dispatches on
