# ADR-0018 — Events block: scope, consumer surface, docs section split

- **Status:** Accepted (2026-06-20). Tracer-bullet shipped in PR #857.

## Decision

A new optional `events:` field lands on the spec root, separate from
the per-part state model. Specs may declare either, both, or neither.
When a spec carries both, codegen glues the link at the wrapper layer
(a state transition that closes an overlay fires the declared
`dismiss` event from the same handler) — there is no spec-level field
tying an event to a transition.

Every spec with a non-empty `events:` block exposes **two callable
surfaces** generated from the same entries:

1. **Per-event props.** One typed prop per declared event
   (`onSelect`, `onDismiss`, `onInputChange`). Each carries a typed
   payload object — never positional arguments.
2. **Discriminated `onEvent` channel.** One prop per component,
   payload is a discriminated union over `type`. The channel fires
   for **both declared events and controllable callbacks** —
   `pattern: "controllable"` mirrors remain as their own per-event
   props but are also visible to the channel.

When a single user gesture emits more than one thing, the wrapper
fires in a fixed sequence: declared event prop → channel for that
event → controllable callback → channel for the state mirror. Each
emission is its own channel call; declared events always fire before
their corresponding state mirror so consumer code can read the
semantic reason without racing the state update. Vue ships the same
shape: per-event emits (`@dismiss`, `@select`) plus a literal
`@event` channel.

The generated docs page splits the single `## Props` table into four
role-keyed sections — `## Configuration`, `## Content`, `## State`,
`## Events` — in that fixed order. The renderer infers each prop's
section from existing markers (`slot: true` → Content;
`pattern: "controllable"` → State; an entry in `events:` → Events;
everything else → Configuration). No new spec field is introduced.

## Why this and not the alternatives

- **Not "derive events from a generalized statechart."** At the time
  of this decision only Modal and Tooltip carried interaction wiring,
  both with a narrow overlay vocabulary; promoting it to a full
  statechart vocabulary required anticipating 8+ unbuilt components.
  RFC-0007 later answered that question with per-part `states:` blocks
  on a per-part basis — the events surface in this ADR remained
  independent and unchanged through that landing. The industry split
  was the load-bearing data point: Radix, React Aria, Spectrum,
  Mantine, and Chakra all hand-roll without statecharts; Zag.js is
  the single outlier.
- **Not "block events on the statechart question."** The events
  surface is needed today by every wrapped Modal / Combobox /
  DataTable consumer (RFC-0006 § Motivation). Waiting for an
  unwritten state-machine RFC would leave the surface broken for an
  indefinite window.
- **Not channel-only (Spectrum's `onAction` taken to its
  conclusion).** Per-event ergonomics are the dominant call-site
  pattern across every major React DS (Radix, Spectrum, Zag,
  Mantine, MUI). Forcing every consumer to `switch` on a
  discriminator just to handle one event hurts the common case and
  gives up TypeScript's per-prop narrowing.
- **Not per-event-only (Radix / Zag / Mantine default).** PostHog /
  Datadog / Segment integration is a recurring real consumer need
  (#669). Without a channel, every consumer writes N-per-component
  bridging code. The channel costs ~10 lines of generated wiring per
  spec and removes that boilerplate entirely.
- **Not "channel only for controllable, declared events only for
  declared events."** Splitting the channel by source would leak the
  spec's internal classification into the consumer's analytics
  layer. A consumer's "what just happened on this component" lens
  should not need to know that `valueChange` is a controllable
  mirror and `dismiss` is a declared event.
- **Not free-order emission.** Without a documented ordering, a
  consumer reading both `onDismiss` and `onOpenChange` would see them
  in whichever order the wrapper happened to fire. Pinning the order
  — declared event before state mirror, per-event handler before
  channel — means consumer code can rely on reading the semantic
  reason from a closure variable in `onOpenChange` if it wants to.
- **Not positional payload arguments.** `(reason, target) => …`
  couples the call site to the declared order; payload objects let
  new fields be added without breaking existing handlers. Matches
  React Aria's `(e: { … })` shape and Vue's payload-object
  convention.
- **Not a schema-level `section:` field per prop for docs.** A
  `section:` override would let spec authors place a prop in any
  section regardless of its actual role. That breaks the audit story
  — reviewers could no longer trust that everything under `## State`
  came from a controllable pair. Inferring from the existing markers
  keeps the section assignment derivable from the spec's structural
  truth.
- **Not "render Events only when the spec has events."** Empty
  sections still render (with a one-line "no declared events" note)
  so the page shape is consistent. A reader landing on Button's page
  learns "no declared events; use native `onClick`" from the same
  section that, on Combobox, lists five.

## Consequences

- The Zod schema gains one optional field (`events:`) on the spec
  root. Specs that don't declare it are byte-identical under
  codegen.
- `gen-contract` emits one TypeScript prop per declared event plus
  the `<Spec>Event` discriminated union plus an `onEvent?: (e:
  <Spec>Event<...>) => void` prop. The union includes both declared
  events and controllable callbacks.
- `gen-react` and `gen-vue` emit the per-emission ordering in
  wrapper code: each handler calls the per-event prop, fires the
  channel with the same payload (`{ type, ...payload }`), then
  proceeds to the controllable callback (which also fires the
  channel after the state-mirror prop).
- The discriminated union grows linearly with declared events plus
  controllable pairs. A 12-event DataTable becomes a ~15-arm type;
  TypeScript handles it but the hover symbol is large.
- Vue's literal `@event` emit is slightly foreign vs the per-event
  `@dismiss` idiom Vue developers expect. Documented in the
  generated docs; not deep cost.
- `onEvent` is always present on the props interface (not gated
  behind a separate import path). The tree-shake cost of an
  undefined-default handler is essentially zero, and a single attach
  point matters more than a marginal bundle saving.
- The ordering rule is a runtime contract, not just a docs note.
  Cross-framework DOM-parity testing (#841) will eventually assert
  the order on both React and Vue outputs.
- `scripts/codegen/src/generators/gen-docs/_shared/sections.ts`
  splits `renderProps` into `renderConfiguration` / `renderContent`
  / `renderState` / `renderEvents`. The shared row-rendering helper
  stays one function; only the partitioning is new. Every existing
  component docs page re-renders into the new layout the first time
  `pnpm gen` runs after the split lands.
- Docs anchors change: `#props` → `#configuration` / `#content` /
  `#state` / `#events`. Acceptable because there are no published
  consumers of the docs site yet; if that changes, a redirect rule
  lands at the Astro level.
- Hardcoded composite-emitted props (`asChild`, `ref`) keep needing
  explicit rows in
  `scripts/codegen/src/generators/gen-docs/_shared/sections.ts` — the
  generator does not infer them from a spec field because no field
  declares them. After the split, those explicit rows live under
  whichever per-section helper matches their role.
- Native DOM events (`onClick` on Button) keep flowing through the
  existing `Omit<…>`-based spread. The events surface is additive:
  it doesn't replace DOM events for atoms that don't need a semantic
  layer.
- RFC-0007 superseded the interactions track with per-part `states:`
  machines. The events surface is unchanged: `emits:` literals inside
  a transition's target fire the declared event with the bound
  payload, threaded through the per-event prop → channel → controllable
  callback → channel order pinned above. Behavior tests derived from
  state transitions (#582) become tractable once the state-transition
  smoke tests land per the RFC-0007 generator notes.

## References

- [RFC-0006](../RFC/0006-events.md) — consumer event surface. This
  ADR records the scope-and-surface settlements (events vs
  interactions independence, per-event + channel layered surface,
  per-emission ordering, four-section docs split).
- [ADR-0001](0001-rewrite-not-migrate.md) — "don't design for unbuilt
  components." Applied here to the statechart question.
- [ADR-0015](0015-codegen-layout.md) — target-first generators; this
  ADR touches `gen-contract`, `gen-react`, `gen-vue`, and `gen-docs`.
- [ADR-0019](0019-closed-vocabularies-for-events.md) — the closed
  vocabularies this surface relies on.
- [#582](https://github.com/teseor/teseor/issues/582) — behavior
  tests from interactions; blocked on the state-model generalization
  this ADR defers.
- [#669](https://github.com/teseor/teseor/issues/669) — analytics /
  tracking; the `onEvent` channel is its foundation.
- [#690](https://github.com/teseor/teseor/issues/690) — events block
  umbrella.
- [#841](https://github.com/teseor/teseor/issues/841) —
  cross-framework DOM-parity contract test that will pin the
  ordering rule.
