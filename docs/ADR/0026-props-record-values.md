# ADR-0026 — Top-level variants/intents/sizes consolidate into `props:` (inline-object values; type derived from value keys)

- **Status:** Proposed.
- **Deciders:** repo owner (letanure).

## Decision

Top-level spec blocks `variants:`, `intents:`, and `sizes:` retire. The props
they conceptually represent (`variant`, `intent`, `size`) move under `props:`.
A `propEntry` whose `values:` is a record uses the inline-object form: each
value is `{ description, tokens? }`. Per-value CSS-token maps live INSIDE the
value entry (today's intents/sizes `tokens:` field), not as a sibling block.
When `values:` is present, the TS type emitted by `gen-contract` is the
union of value keys; the `type:` field is omitted (it was a misnomer — bare
`string` doesn't describe the constraint). `type:` stays on non-enum scalar
props (`boolean`, `number`, open-set `string`). The legacy array form
(`values: [a, b, c]`) and `type: string + values: [...]` shape retire with
the migration so every enum prop reads the same way.

```yaml
props:
  variant:
    default: solid
    values:
      solid:
        description: Filled background with the intent color; default visual weight.
      outline:
        description: Transparent background with intent-colored border and label.
      ghost:
        description: Transparent background, no border, intent-colored label.

  intent:
    default: neutral
    values:
      neutral:
        description: Default semantic color; non-emphasized metadata badges.
        tokens: { bg: --t-surface-muted, fg: --t-on-surface }
      primary:
        description: Accent-colored badge; matches the page's primary action.
        tokens: { bg: --t-accent, fg: --t-on-accent }
      success:
        description: Positive status (active, online, completed).
        tokens: { bg: --t-success, fg: --t-on-success }

  size:
    default: md
    responsive: true
    values:
      sm:
        description: Compact density; inline with small prose.
        tokens: { font-size: --t-text-xs }
      md:
        description: Default size; matches body text.
        tokens: { font-size: --t-text-sm }
      lg:
        description: Emphatic; for hero callouts and prominent surfaces.
        tokens: { font-size: --t-text-base }

  shape:
    default: rounded
    values:
      rounded:
        description: Token-controlled radius corners (default).
      pill:
        description: Fully rounds the inline ends for chip-style badges.

  disabled:
    type: boolean
    default: false
    description: Disables the interactive control.

  gap:
    type: string
    description: Inline-direction spacing token (open-set; accepts any spacing-token suffix).
```

`visualStates:` keeps its current top-level position — it describes runtime
states (`:hover`, `:focus-visible`, …) of the rendered element, not props.

## Why inline-object values, dropped `type:`, and not the alternatives

- **Not sibling-keyed tokens (`values: { a: "..." }` + `tokens: { a: { ... }, b: { ... } }`).**
  Value names repeat between blocks. Adding a value is two edits; forgetting
  one is silent drift that only the schema check catches. Inline-object form
  is one edit per value. See memory `feedback_sync_safety_over_visual_brevity`.
- **Not parallel-shape (array OR record).** Legacy `values: [a, b, c]` is kept
  valid only for the migration window. Long-term, two shapes for the same
  field is a cognitive tax with no benefit — every consumer branches,
  authors guess which form to use. Uniform record form is the post-migration
  end state.
- **Not array-of-objects (`- name: solid, description: …`).** Loses YAML's
  natural key uniqueness, forces every consumer (vocabulary check, examples
  reference check, contract emit) to lookup-by-field-name instead of direct
  property access, and breaks symmetry with `props:`, `tokens:`, `examples:`
  (all keyed records today).
- **Not keeping `type: string` on enum props.** ADR-0006 kept `type: string`
  because the runtime contract is a string (CSS attribute selector), but at
  the schema/TS level the type is the union of value keys, not bare string.
  Dropping `type:` when `values:` is present is the honest shape. The CSS
  runtime contract doesn't change — only the schema representation.
- **Not keeping the top-level blocks.** `variants:` / `intents:` / `sizes:`
  each emit an auto-derived wrapper prop (`variant`, `intent`, `size`)
  rendered at the head of the docs Props table. Splitting "prop surface"
  across `props:` + three sibling blocks adds three reading paths for one
  conceptual surface and three special-case branches in
  `codegen/src/lib/flatten.ts` and
  `codegen/src/generators/gen-docs/_shared/sections.ts`. Co-locating is the
  simplification.

## Consequences

- **Localization is mechanical.** Translators copy `values:` from the base
  spec and edit only `description:` fields. `tokens:` entries are obvious
  CSS variables and stay untouched. Programmatic extraction: "the
  `.description` field of each value entry is the localizable surface."
- **Add-a-value is one edit.** A new `info` intent means one entry under
  `props.intent.values:` carrying both its description and its token map.
  No second block to remember.
- **`responsive: true` becomes explicit on `size`.** The
  `RESPONSIVE_BLOCK_PROPS = new Set(["size"])` heuristic in
  `codegen/src/lib/responsive-blocks.ts` retires; each prop declares its
  own responsiveness.
- **Per-value descriptions are richer documentation.** Replacing prop-level
  one-liners like *"Corner shape. `rounded` is the default..."* with
  per-value entries is a strict improvement for the docs Props table and
  for IDE hover text.
- **Migration is snapshot-gated.** Phase 2 converts `badge.yaml` as the
  canonical reference; `pnpm gen` + the `contract-snapshots` Playwright
  suite catch any drift. Phases 3 and 4 fan out across the remaining 16
  specs in small PRs.
- **Old code paths delete cleanly.** The `variantsPlugin` schema's
  atomic/part `variants:` / `intents:` / `sizes:` records collapse to just
  `visualStates:`. The flatten branches, the special-case docs rendering in
  `codegen/src/generators/gen-docs/_shared/sections.ts`, the vocabulary
  check, the token usage check, the events generic-aliases check, and the
  `codegen/src/lib/responsive-blocks.ts` heuristic all simplify.
- **ADR-0006 is amended, not superseded.** The "constrain string props via
  `values:`" decision stands; the shape of `values:` becomes a record of
  inline objects (was an array), and the `type: string` marker drops when
  `values:` is present. Same underlying intent: closed-set string at runtime,
  narrowed TS type at compile time.

## References

- ADR-0006 — Enum-typed string props (this ADR amends the shape).
- ADR-0008 — Token-driven component CSS (the tokens consumer).
- Issue #1000 — tracking issue + phase plan.
- Memory `feedback_sync_safety_over_visual_brevity` — the principle behind
  inline-object over sibling-keyed maps.
