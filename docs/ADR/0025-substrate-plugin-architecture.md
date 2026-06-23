# ADR-0025 — Substrate plugin architecture

- **Status:** Accepted (2026-06-24). Amended 2026-06-23 — see **Amendment** below.

## Amendment 2026-06-23 — emit code lives in per-target generators, not plugins; slot model dropped

After 12 of the ~28 Phase-2 plugin extractions landed locally, a maintainer review surfaced a forking concern that supersedes the original emit model: when a framework major (React 20, Vue 4) ships breaking changes, we want to ship both old-and-new wrapper trees in parallel from one teseor release (separate npm packages, e.g. `@teseor/vue-3` and `@teseor/vue-4`), then sunset the old tree. The original "plugin owns emit per target" model spreads the per-target code across ~20 plugin folders, making each fork awkward — the answer to "what does React 19 emit for a Button" is "read 20 plugins."

The pivot:

1. **Plugins keep schema + check + analyze only.** They do NOT contain emit code. The `emit` field on `SubstratePlugin` is removed; the `runtime` field is removed.
2. **Per-target generators own all emit code for that target+version.** Folder naming carries the version: `scripts/codegen/src/generators/gen-react-19/`, `scripts/codegen/src/generators/gen-vue-3/`. Framework-agnostic generators (`scripts/codegen/src/generators/gen-contract/`, `scripts/codegen/src/generators/gen-docs/`, `scripts/codegen/src/generators/gen-tests/`) stay un-versioned.
3. **The slot model is dropped.** The `slots.ts` module (deleted), `EmitSlot`, `EmitContribution`, `EmitTarget`, `EmitContext`, and `emitSlot()` in the orchestrator are all gone. Per-target generators write strings procedurally — they read `SpecAnalysis` + `Spec` and assemble output directly.
4. **Forking events become trivial.** Cloning `scripts/codegen/src/generators/gen-react-19/` → `scripts/codegen/src/generators/gen-react-20/` and mutating procedural code is the workflow when React 20 ships. The plugins (substrate semantics) are the stable invariant.
5. **SpecAnalysis stays load-bearing.** Cross-plugin facts (e.g. `responsivePropNames`, `branchComputes`, `hasAs`) are still contributed by plugins' `analyze` functions and merged by the orchestrator. Generators consume the merged analysis as inert input.

### Three-layer architecture (post-amendment)

```text
Layer 1 — substrate primitives (plugins/<feature>/)
  • schema fragment      (Zod)
  • validation check     (semantic correctness)
  • analyze contribution (cross-target facts → SpecAnalysis)
  ✗ no emit code, ever

Layer 2 — per-target string assembly (generators/gen-<target>-<version>/)
  • imperative: reads Spec + SpecAnalysis, writes strings
  • procedural helpers, branching, version-specific logic
  • one folder per (target, version) pair; framework-agnostic targets
    (contract/docs/tests) stay un-versioned
  ✗ does not compute analyze facts
  ✗ does not validate

Layer 3 — orchestrator (core/)
  • computes SpecAnalysis once per spec (walks plugins)
  • runs all plugin checks
  • dispatches to per-target generators
  ✗ no slot abstraction
  ✗ no emit indirection
```

### Revised plugin interface

```ts
type SubstratePlugin = {
  name: string;
  schema: {
    atomic?: Record<string, ZodType>;
    composite?: Record<string, ZodType>;
    part?: Record<string, ZodType>;
  };
  analyze?: (spec: Spec) => Partial<SpecAnalysis>;
  check?: (spec: Spec, ctx: CheckContext) => Issue[];
};
```

Removed since the original ADR: `emit`, `runtime`.

### Revised file layout

```text
scripts/codegen/src/
├── cli.ts
├── core/
│   ├── plugin.ts          # SubstratePlugin contract (slimmer)
│   ├── analysis.ts        # SpecAnalysis type + merger
│   ├── schema.ts          # composes plugin.schema fragments
│   ├── registry.ts        # PLUGINS = [...]
│   └── orchestrator.ts    # computeAnalysis + runChecks; ~20 LOC
├── plugins/<feature>/
│   ├── index.ts           # { name, schema, analyze?, check? }
│   ├── schema.ts
│   ├── check.ts           # optional
│   └── analyze.ts         # optional
├── generators/
│   ├── gen-react-19/      # all React 19 wrapper assembly
│   │   ├── kinds/         # atomic.ts, composite-list.ts, composite-overlay.ts
│   │   ├── _shared/       # per-target helpers (renderPropsType, renderImports, ...)
│   │   ├── workspace/     # cross-spec outputs (runtime.ts, barrel, README)
│   │   └── index.ts       # entry — calls orchestrator.computeAnalysis, then writes
│   ├── gen-vue-3/         # all Vue 3 wrapper assembly (same shape)
│   ├── gen-contract/      # framework-agnostic .d.ts
│   ├── gen-docs/          # framework-agnostic MDX
│   └── gen-tests/         # framework-agnostic test fixtures
└── lib/                   # pure utilities
```

Deleted vs the original ADR: the `slots.ts` module.

### Why this pivot

- **Real fork-readiness.** When Vue 4 ships, the migration is "clone `scripts/codegen/src/generators/gen-vue-3/` to `scripts/codegen/src/generators/gen-vue-4/`, mutate the procedural code in place." No need to thread version-awareness through every plugin's emit handler.
- **Cleaner separation.** Plugins are pure substrate semantics — testable in isolation, reusable across any future target. Generators are pure string assembly. The boundary is enforced by the type system (plugin returns `Partial<SpecAnalysis>`; generator receives readonly `SpecAnalysis` + `Spec`).
- **Removed indirection.** The slot abstraction's only structural value was "many plugins → one output position." That coordination problem dissolves when one file owns assembly. The append/exclusive/decorate union, the `slots.ts` enumeration, and the orchestrator's `emitSlot()` dispatch all go away. ~150 LOC of scaffolding deleted.
- **DX win.** A substrate author edits ONE plugin folder for declarative work. A generator author reads ONE folder to understand a target's output end-to-end. New contributors learn two concepts (declarative plugins, imperative generators) instead of three (plugins, slots, generators).
- **Honest about today's structure.** Today's `scripts/codegen/src/generators/gen-react-19/kinds/atomic.ts` is procedural — that's the shape generators already have. The original ADR proposed replacing it with slot dispatch; this amendment keeps it procedural, just leaner (compute-once analysis as input).

### Trade-offs accepted

- **Substrate is split across two folders.** A feature like `branches` lives partly in `scripts/codegen/src/plugins/branches/` (schema/check/analyze) and partly in `scripts/codegen/src/generators/gen-<target>/...` (per-target emit lines). Not end-to-end in one folder. Same fan-out as the original ADR — just grouped by target instead of by feature.
- **Per-target reusable helpers (`renderPropsType`, escape utilities, …) may duplicate across forks.** Default policy: duplicate first; extract `scripts/codegen/src/generators/gen-react-shared/` only if drift becomes painful with two or more living React versions. Premature deduplication of a tree we don't yet have is worse than the duplication itself.
- **No "uniform contribution model" for cross-cutting emit hooks.** A future hypothetical "performance.ts" plugin can't inject a profiling header into every wrapper via a slot — it has to be added procedurally to each generator. This was a theoretical benefit that no current substrate needs.
- **Phase 0 scaffolding partly becomes dead code.** Commits `bd61df0` (enumerate emit slots) and parts of `df4182d` (orchestrator skeleton) introduced slot machinery that this amendment removes. Cleanup happens during the Phase 3 cutover.

### What's unchanged

- The four schema-shape consolidations (latch rename, root unification, a11y.attrs, defaultChildren-stays). Phase 4 work proceeds as the original ADR specified.
- Plugin folder structure for the declarative half (schema/check/analyze). Phase 0–2 work to date stands; 12 of ~28 plugins already migrated.
- SpecAnalysis as a closed catalogue of cross-plugin facts. Type-safe contributions, type-safe consumption.
- The orchestrator computing analysis + running checks. Just shorter — no slot dispatch.
- One-PR delivery for the whole substrate move + four consolidations. Snapshot tests still gate byte-equivalence for the architectural move.

### Issue #984 — framework-version tagging

Filed during the same session as the pivot. Originally framed as "stamp a marker on generated wrappers"; under the amendment it becomes natural — the version IS the generator folder name (`scripts/codegen/src/generators/gen-react-19/`), and any marker constant lives inside that folder.

---

The original Decision below describes the pre-amendment design. Read it as historical context; the Amendment above is what gets implemented.

## Decision

The codegen substrate is decomposed into **plugins**. Each plugin owns one
substrate feature end-to-end: its schema fragment, its semantic check, its
emit per generator target, and (when applicable) its runtime helper. The
codegen core is a thin orchestrator: it composes plugin schema fragments
into the top-level `Spec`, runs each plugin's check, computes a shared
`SpecAnalysis` from plugin contributions, then walks the registry asking
each plugin to emit into named slots, and concatenates per slot.

Alongside the architectural move, four schema-shape consolidations land in
the same change:

1. Atomic `state:` is renamed `latch:`. Frees the word `state` to mean
   only the parts-level state machine declared by `states:`. Today the
   same word denotes two unrelated mechanisms — a single boolean wrapper
   ref (Avatar) and the part-state-machine block (Modal, Tooltip).
2. `element:`, `elementByProp:`, and `polymorphic: "asChild"` collapse
   into a single discriminated `root: { kind: "static" | "byProp" |
   "polymorphic", ... }` block. One field, one syntax, exhaustive
   discriminated union; the mutual exclusion currently enforced by
   semantic checks becomes intrinsic to the schema shape.
3. `a11y.labelProp`, `a11y.decorativeProp`, and `a11y.ariaProps` fold
   into a single `a11y.attrs:` block keyed by ARIA attribute name, with
   value forms `{ fromProp: <name> }` (conditional) and
   `{ static: <value> }` (literal). The mutual-exclusion rule between
   `labelProp` and `decorativeProp` becomes a schema-level constraint on
   the same attribute key, not a cross-field semantic check.
4. `defaultChildren:` stays as its own field — it's legible for its
   use case (constrained-children elements like `<select>` needing
   `<option>`) and not a special case of `branches:` (which picks one
   of N children at render time; `defaultChildren` is unconditional
   structural content).

`htmlAttrs:`, `imperativeProps:`, `formControl:`, `polymorphic:` (now
inside `root:`), `branches:`, `latch:`, `states:`, `overlay:`, `motion:`,
`a11y:`, `props:`, `tokens:`, `variants:`, `intents:`, `sizes:`,
`visualStates:`, `events:`, `constraints:`, `repeating:` each become a
plugin. ~20 plugin folders.

### Plugin interface

```ts
type SubstratePlugin = {
  name: string;
  schema: {
    atomic?: Record<string, ZodType>;
    composite?: Record<string, ZodType>;
    part?: Record<string, ZodType>;
  };
  analyze?: (spec: Spec) => Partial<SpecAnalysis>;
  check?: (spec: Spec, ctx: CheckContext) => Issue[];
  emit: Partial<Record<EmitSlot, EmitContribution>>;
  runtime?: { react?: string; vue?: string };
};
```

### SpecAnalysis (statically enumerated)

```ts
type SpecAnalysis = {
  ariaPropNames: Set<string>;
  elementByPropControllingProp: string | undefined;
  controllablePropNames: Set<string>;
  slotPropNames: Set<string>;
  responsivePropNames: Set<string>;
  branchComputes: Set<string>;
  hasAs: boolean;
  hasPolymorphic: boolean;
  hasDisabled: boolean;
  hasLoading: boolean;
  voidStatus: "all" | "none" | "mixed";
};
```

The field set is the closed catalogue of cross-plugin reads observed in
the procedural `scripts/codegen/src/generators/gen-react-19/kinds/atomic.ts` today. Plugins contribute fragments via
`analyze`; the orchestrator merges; each plugin's `emit` receives the
merged analysis. Plugins never import one another.

### Slot model (three contribution kinds)

- **Append slot** — accumulating; every plugin can contribute lines that
  the orchestrator concatenates in registry order. Used for imports,
  helpers, useState/useEffect blocks, root attrs.
- **Exclusive slot** — single-claimant; at most one plugin emits per
  spec. Used for the root tag and the root-children body. The schema's
  discriminated unions guarantee at most one applicable plugin per spec.
- **Decorate slot** — wraps an inner contribution; used by
  `slotElement` to wrap the body.

The slot enumeration was fixed in the (since-deleted) `slots.ts` module. Adding a new slot was a
core change touching the registry of every plugin that should contribute;
that cost was deliberate — slot stability was the contract.

### File layout

```text
scripts/codegen/src/
├── cli.ts
├── core/                       # plugin contract + orchestrator
│   ├── plugin.ts
│   ├── slots.ts
│   ├── analysis.ts             # SpecAnalysis type + merger
│   ├── schema.ts               # composes plugin.schema fragments
│   ├── registry.ts             # PLUGINS = [...]
│   └── orchestrator.ts
├── plugins/                    # one folder per substrate feature
│   └── <feature>/
│       ├── index.ts            # exports the plugin object
│       ├── schema.ts
│       ├── check.ts            # optional
│       ├── analyze.ts          # optional
│       ├── emit/{react,vue,contract,docs,tests}.ts
│       └── runtime.ts          # optional
├── generators/                 # thin per-target entry points
│   └── gen-<target>/
│       ├── index.ts            # calls orchestrator with target=...
│       └── workspace/          # cross-spec outputs (barrel, README, runtime)
└── lib/                        # pure utilities
```

`scripts/codegen/src/schema.ts` (419 LOC) → `scripts/codegen/src/core/schema.ts` (~40 LOC composer).
`scripts/codegen/src/semantic-checks.ts` (2882 LOC) → 23 plugin-local checks + `scripts/codegen/src/plugins/constraints/check.ts` (the two cross-plugin rules both involve `constraints`).
`scripts/codegen/src/generators/gen-{react,vue}/kinds/atomic.ts` (335 + 314 LOC) → `scripts/codegen/src/core/orchestrator.ts` (~50 LOC) + per-plugin `emit/{react,vue}.ts` modules.

## Why this and not the alternatives

- **Not file reorg without field consolidations.** Moving the procedural
  body into plugin folders without addressing the two-state-systems
  naming collision, the three-way root-tag split, and the a11y
  conditional-attr fragmentation leaves the same legibility problems
  with extra files in the way. The plugin packaging only pays off when
  the substrate concepts it packages are themselves clean.
- **Not field consolidations without the plugin architecture.** The
  current monolith makes every consolidation a multi-file edit through
  `scripts/codegen/src/schema.ts`, `scripts/codegen/src/semantic-checks.ts`, `scripts/codegen/src/generators/gen-{react,vue}/kinds/atomic.ts` (both React and
  Vue), `gen-contract`, `gen-docs`, `gen-tests`. The point of going
  through this work is that the *next* substrate change touches one
  folder; renaming a field today still touches the same five-to-eight
  files.
- **Not a phased migration (plugin-by-plugin PRs with a coexistence
  window).** Each plugin extraction in the procedural body is
  intertwined with the next via cross-feature filtering (e.g. props
  filters out a11y's ariaProps). A coexistence window means the
  orchestrator and the procedural body both touch the same lines, and
  the snapshot tests only verify one. Single-PR delivery eliminates the
  drift window; the snapshot tests are the gate.
- **Not a plugin-extensible `SpecAnalysis`.** Letting plugins add
  arbitrary fields breaks type safety for downstream plugins that read
  the analysis. The closed catalogue is what the procedural code
  already cross-references; statically enumerating it captures today's
  reality and rejects new cross-cuts at the type system.
- **Not unifying atomic `latch:` and parts-level `states:` under one
  discriminated `state:`.** They live at different scopes (wrapper-root
  vs sub-part) and serve different runtimes (a single boolean ref vs a
  full transition graph). Sharing a name implies sharing semantics they
  don't share. Renaming the atomic case (`latch:`) and keeping
  parts-level `states:` records the genuine distinction.
- **Not deferring the root-tag unification (`root: { kind }`) to a
  follow-up ADR.** Defers the same conversation forever. The plugin
  architecture re-touches every spec that uses `element` /
  `elementByProp` / `polymorphic`; landing the unification in the same
  change costs one extra codemod pass and pays off in every subsequent
  spec author's mental model.

## Consequences

- One PR delivers: the `scripts/codegen/src/core/` scaffolding, the ~20 plugin folders, the
  `scripts/codegen/src/generators/gen-react-19/kinds/atomic.ts` and `kinds/composite-*.ts` rewrites
  (plus the matching `scripts/codegen/src/generators/gen-vue-3/` rewrites) in both
  framework generators, the `semantic-checks.ts` decomposition, the
  `schema.ts` decomposition, the rewritten specs (hand-edited per Phase 4 — the original codemod plan was dropped pre-1.0), and a changeset.
- The existing snapshot tests (`generators/__tests__/__snapshots__/*.snap`)
  gate output equivalence — every generated file's content stays
  byte-identical for the architectural move; only the four
  consolidations show in snapshot diffs (and those diffs are the
  intended migration result).
- Each plugin colocates `schema.test.ts`, `check.test.ts`, and
  `emit.test.ts`. The plugin folder is self-contained: adding a new
  substrate feature is `mkdir plugins/<feature>` + drop in the five
  standard files + register in `scripts/codegen/src/core/registry.ts`.
- The `_runtime.ts` template per framework becomes a composed file: the
  generator's `scripts/codegen/src/generators/gen-{react,vue}/workspace/runtime.ts` assembles helpers from each
  plugin's `runtime.{react,vue}.ts`. Today's `_runtime.ts` (manually
  curated) ships its existing helpers as plugin contributions
  (`mergeClass`, `asElement`, `Responsive`, `responsiveDataAttrs`,
  `mergeRefs`, `deriveInitials`).
- ADR-0009 (schema and validation) is partially superseded by the
  schema-decomposition described here; the validation discipline it
  established is preserved.
- ADR-0020 (states live on parts) is reinforced — the atomic
  `latch:` rename eliminates the residual name collision with the
  part-level `states:` it introduced.
- Width-vs-depth: the substrate stops growing horizontally per new
  component. New capabilities (e.g. a future `viewport:` block for
  IntersectionObserver-driven specs) land as one new plugin folder,
  not as another field in `schema.ts` + another `checkX` in
  `semantic-checks.ts` + another six emit-call sites across generators.

## References

- [ADR-0009](0009-spec-schema-and-validation.md) — partially superseded
  by the schema decomposition described here.
- [ADR-0015](0015-codegen-layout.md) — established the
  per-generator-per-kind layout this builds on.
- [ADR-0020](0020-states-live-on-parts.md) — introduced the
  parts-level `states:` block whose name collision motivates the
  atomic-`state:` → `latch:` rename.
- [#979](https://github.com/teseor/teseor/issues/979) — paired
  guardrail (post-merge CSS rebuild) shipped in the same session as
  this ADR was authored.
