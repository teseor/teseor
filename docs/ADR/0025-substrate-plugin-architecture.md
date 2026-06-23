# ADR-0025 — Substrate plugin architecture

- **Status:** Proposed (2026-06-23).

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
the procedural `scripts/codegen/src/generators/gen-react/kinds/atomic.ts` today. Plugins contribute fragments via
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

The slot enumeration is fixed in `scripts/codegen/src/core/slots.ts`. Adding a new slot is a
core change touching the registry of every plugin that should contribute;
that cost is deliberate — slot stability is the contract.

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
  `scripts/codegen/src/generators/gen-{react,vue}/kinds/atomic.ts` and `kinds/composite-*.ts` rewrites in both
  framework generators, the `semantic-checks.ts` decomposition, the
  `schema.ts` decomposition, a one-shot migration script
  (`scripts/repo/migrate-substrate-consolidation.ts`) that rewrites
  every spec for the four consolidations, the rewritten specs
  themselves, and a changeset.
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
