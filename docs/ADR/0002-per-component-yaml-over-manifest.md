# ADR-0002 — Per-component YAML over monolithic manifest

- **Status:** Accepted.
- **Deciders:** repo owner (letanure).

## Context

Three options for the codegen source of truth:

1. **Monolithic `manifest.json`** — one file with every component's API surface in nested JSON.
2. **Colocated `<name>.api.json`** — JSON file next to each component's CSS; auto-discovery walks the tree.
3. **Per-component YAML at `specs/<name>.yaml`** — flat catalog, separate from CSS.

The codegen pipeline needs a source-of-truth that's:

- Single-purpose per component (so adding a component is a self-contained PR).
- Human-readable (specs get reviewed during PRs by people who don't want to read JSON syntax with quoted keys).
- Easy to validate (Zod schema runs in `validate-spec.ts`; see ADR-0009).
- Linkable from issues, PRs, docs (`specs/button.yaml#L42` is meaningful).

## Decision

Per-component YAML at `specs/<name>.yaml`.

```text
specs/
├── button.yaml
├── input.yaml
├── modal.yaml
└── ...
```

The CSS file stays at `packages/css/src/components/<name>/<name>.css`. The spec is the API description; the CSS is the visual implementation. The codegen pipeline (`codegen/`) reads `specs/*.yaml`, walks `packages/css/src/components/`, and emits everything else.

## Why YAML, not JSON

- Comments. A spec field with `# only relevant for atomic buttons` reduces review back-and-forth.
- No quoted keys. `name: button` instead of `"name": "button"`.
- Multi-line strings work cleanly for `description:` and `guidance:`.
- Schema validation is unaffected — Zod runs against the parsed object regardless of source format.

The trade is that YAML's whitespace sensitivity catches people occasionally. We accept that — it's a small cost paid once per spec author.

## Why per-component, not monolithic

- Adding a component is one new file + one new CSS file + matching tests. No merge conflicts on a shared monolith.
- Codegen iterates over `specs/*.yaml` directly. No "split the manifest" step.
- Component history is preserved when files move (e.g. when promoting a Phase 2 component out of beta). `git log specs/button.yaml` tells the story; `git log manifest.json` doesn't.

## Why `specs/`, not colocated with CSS

- The CSS path (`packages/css/src/components/button/button.css`) is *implementation*. The spec is *contract*. Mixing them tells contributors "edit them together" — but they should not be edited together; specs change rarely once stable, CSS gets visual tweaks regularly.
- One flat `specs/` directory makes the catalog obvious. `ls specs/` is the component list.
- Generated wrappers reference `specs/<name>.yaml` paths in their headers, and a flat path is short.

## Spec shape

See `architecture/codegen-pipeline.md` for the full schema. The essentials:

```yaml
name: button
kind: atomic           # atomic | composite — per ADR-0009 the discriminator is open
element: button
rootClass: t-button
variants:
  solid:   { description: Filled background. }
  outline: { description: Transparent background. }
intents:
  primary: { description: Most important action., tokens: { bg: --t-accent, fg: --t-on-accent } }
  neutral: { description: Default action.,        tokens: { bg: --t-surface, fg: --t-on-surface } }
sizes:
  sm: { description: Compact density., tokens: { height: --t-row-2 } }
  md: { description: Default size.,    tokens: { height: --t-row-3 } }
props:
  loading: { type: boolean, default: false, description: Shows a spinner. }
tokens:
  height: { fallback: --t-row, desc: Control height. }
private: [--_h, --_bg]
a11y:
  role: button
  keyboard: { Enter: activate, Space: activate }
examples:
  - id: solid-primary
    props: { variant: solid, intent: primary }
```

`variants:`, `intents:`, `sizes:`, and `states:` are maps keyed on the value
name, each carrying a `description:`. ADR-0009 records the full schema.

## Consequences

- Adding a new field to the spec schema is a `validate-spec.ts` change + a spec-migration pass (touch all current specs to add the field with a default). Same shape as a schema migration.
- Removing a spec field is a schema change with a deprecation window (`deprecated: true` in the schema for two minor releases, matching the consumer API deprecation policy in `process/versioning.md`, then removed).
- **Schema freezes per milestone.** The v0.1 schema is frozen for atomic components only. It re-opens at three later points to add reserved slots: `constraints:` at v0.2 (Button reveals the first real mutex rules), `behavior:` + `primitives:` and `parts:` at v0.3 (overlays force a behavior tier and the first composite families — `parts:` was pulled in from v0.4 per RFC 0001), `stability:` deferred. See `architecture/codegen-pipeline.md` § "Reserved fields" and § "Composition" for the planned shapes, and ADR-0009 for the schema model. Until each milestone designs the field, `validate-spec.ts` rejects it as unknown.
