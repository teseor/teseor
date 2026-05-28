# ADR-0019 — Closed vocabularies for event names and payload types

- **Status:** Accepted.
- **Deciders:** repo owner (letanure).

## Decision

Both halves of the events block — the event *name* and its *payload
type* — are constrained by closed vocabularies stored in
`specs/_vocabulary.yaml`. A generated TypeScript mirror at
`scripts/codegen/src/lib/vocabulary.ts` is the single source every
consumer of the vocab (validator, codegen, gen-docs) imports.

**Event names.** The last camelCase token of every event name must be
a registered verb. Synonyms (`close` → `dismiss`, `hide` → `dismiss`,
`update` → `change`, `press` → `activate`, `open` → "use
`pattern: controllable`") are rejected with a suggestion. Verbs are
the base form, not past tense: `fileAdd`, not `fileAdded`;
`endReach`, not `endReached`. The pattern is
`^([a-z]+|[a-z]+([A-Z][a-zA-Z0-9]+)+)$` — bare verb or
`<subjectNoun><Verb>`.

**Payload types.** Every payload field is declared structurally as a
discriminated `PayloadEntry`: `string`, `number`, `boolean`, `enum`
(with `values: string[]`), `generic` (with `ref:` into the spec's
`generics:` block), `builtin` (with `name:` from a closed `builtins:`
list — `Date`, `MouseEvent`, `File`, `Error`, etc.), or `array`
(with `of:` recursing). Every variant accepts `nullable: true` to
promote it to a nullable union. A new top-level `generics:` block on
the spec root lets a single component declare reusable type
parameters (`Item`, `Row`) referenced by `type: generic, ref: <Name>`
in payload fields.

There are no escape hatches: no raw TypeScript strings in `payload:`,
no `unknown` / `any` / `never`, no unregistered builtin names. When
the existing rules don't fit a new case, the rules expand (extend
the vocab, extend the schema) — they don't open bypasses.

## Why this and not the alternatives

- **Not an open verb vocabulary.** Free-form verbs let two
  components ship `close` and `dismiss` for the same action, or
  `cancel` / `abort` / `stop` / `quit` for nominally the same
  gesture. A reader scanning analytics across components would see
  synonyms and not know whether they meant different things. The
  verb registry is what makes the cross-component telemetry layer
  (#669) tractable.
- **Not "synonyms warn, not reject."** A warn-level lint quietly
  accumulates the synonym in CI logs and leaves the spec with the
  wrong name. Hard rejection at validate-time forces the choice to
  the author. The suggestion message tells them which verb to pick.
- **Not past-tense allowed alongside base form.** Two valid names
  per event (`fileAdd` *and* `fileAdded`) would double the registry
  and require an irregular-verb stemmer at validate-time. The minor
  English-awkwardness of `onEndReach` vs `onEndReached` is the trade
  for a single canonical name.
- **Not raw TypeScript strings for payloads
  (`payload: "{ row: T; index: number }"`).** Terse, but a
  TS-fragment parser would have to live in the validator, payload
  field names could not be checked against any registry, and the
  structural shape of the spec would collapse into opaque strings.
  Once strings are accepted, arbitrary types flow through —
  including `unknown` and third-party imports — and the vocab story
  breaks.
- **Not `unknown` / `any` as a fallback variant.** If a payload
  value can't be typed at spec time, the fix is one of: (a) declare
  a generic in the spec's `generics:` block and pass it through;
  (b) redesign the payload to carry identifiers the consumer uses
  to look up the value in data they already own (e.g., `cellEdit`
  carries `{ row, columnId }`, not `{ oldValue, newValue }`). Both
  paths are documented; neither is a bypass.
- **Not "add new built-in types ad-hoc in code."** A new builtin
  (`ResizeObserverEntry`, `URL`) lands as one line in
  `_vocabulary.yaml` plus a description, reviewed under the same
  gate as a new verb. The validator rejects unregistered names
  until the vocab PR lands.
- **Not "constrained generics" in v1.** A spec can declare
  `generics: [{ name: Item, description: … }]` but cannot declare
  `Item extends Record<string, unknown>`. Constraint vocabulary is
  a follow-up — adding raw TypeScript constraint strings would be
  an escape hatch by construction. When a real case demands it, the
  constraint vocab expands to a closed set the same way `builtins:`
  did.

## Consequences

- **Single source.** `specs/_vocabulary.yaml` carries
  `events.verbs`, `events.synonyms`, `events.builtins`, and the
  name pattern. Every consumer (validate-spec, gen-contract,
  gen-react, gen-vue, gen-docs) reads from the generated TS mirror.
  No string lives in two places.
- **Eight new semantic-check rules** in `validate-spec.ts` (RFC-0006
  § Validator rules): event-name pattern, verb-registered, synonym
  rejection (with "—" for controllable-mirror synonyms like `open`),
  generic-ref existence, builtin-name existence, root-only
  declaration, no collision with controllable callback names. The
  `semantic-checks.ts` file is already ~1700 LOC (#838 audit); this
  pushes it further. Audit task remains open.
- **Vocab maintenance becomes a bottleneck.** Every new verb or
  builtin is a one-line vocab PR + description. Cost matches token
  additions; payoff is cross-component consistency.
- **Schema growth.** Zod schema gains `events:`, `generics:`, and
  the recursive `PayloadEntry` discriminated union. Atomic specs
  without events are byte-identical under codegen.
- **`generics:` block is unconstrained in v1.** A spec author
  declares names and descriptions; consumers pass whatever type
  they want at the call site. If a real case demands a bound, the
  constraint vocabulary lands as a follow-up — not as a raw-string
  escape hatch.
- **No state mirror via events.** `open` and `value` are synonyms
  with a `—` canonical: the validator instructs the author to use
  `pattern: "controllable"` on the open / value prop instead. This
  keeps controllable mirrors and declared events as distinct
  authoring concerns even though they share the `onEvent` channel
  (ADR-0018).
- **The generated TS mirror is the typed API surface.** Adding a
  verb in YAML is one line; the mirror keeps the `EventVerb` /
  `BuiltinType` union types honest with zero hand-editing.
  Validator and generators both fail-fast on typos in the YAML
  file.
- **Payload field-name vocabulary** (always-call-it `reason`,
  always-call-it `value`) is deferred to a follow-up vocab PR. The
  failure mode is mild — field names are read at the call site,
  not on every analytics line — and the verb registry is the
  larger consistency lever.

## References

- [RFC-0006](../RFC/0006-events.md) — § "Vocabulary" and § "No
  escape hatches".
- [ADR-0018](0018-events-block-surface.md) — the surface this
  vocabulary types.
- [ADR-0006](0006-enum-typed-string-props.md) — closed-set string
  props; payload `enum` variant builds on the same pattern.
- [ADR-0009](0009-spec-schema-and-validation.md) — Zod schema +
  semantic-check pass; this ADR adds eight rules to that pass.
- [#669](https://github.com/teseor/teseor/issues/669) — analytics /
  tracking layer; the verb registry is what makes its
  cross-component reporting tractable.
- [#838](https://github.com/teseor/teseor/issues/838) — 300-LOC
  file audit covering `semantic-checks.ts`; this ADR adds load to
  it.
