# ADR-0021 — Event source prefix syntax for state transitions

- **Status:** Accepted (2026-06-20). Implementation shipped in PR #872.

## Decision

A transition source key uses one of three prefix forms:

| Form | Example | Resolves to |
| --- | --- | --- |
| `<part>.<dom-event>` | `trigger.click` | DOM event on the named part |
| `key.<name>` | `key.escape` | Global keyboard key |
| `outside.<dom-event>` | `outside.click` | DOM event outside the part's overlay |

`<part>` is any part declared in the spec's parts tree (ADR-0024
keeps the name unambiguous). `<dom-event>` and `<name>` resolve
against closed vocabularies declared in `specs/_vocabulary.yaml`
under new `dom_events:` and `keys:` blocks. Misspellings are
rejected with Levenshtein suggestions, the same machinery
ADR-0019 uses for event-verb names.

Delays do not have a prefix. A timer is set via the transition's
`after:` field, which names a same-part numeric prop; the
state-machine runtime owns scheduling and cancellation.

`outside.*` is permitted only when the part declares `overlay:`.
Any other usage is rejected at validation time.

## Why this and not the alternatives

- **Not a flat list of `{ on, target, do }` rules (today's
  `interactions:` block).** The flat rule list joins a target part
  and an event name by independent string fields; misspelling either
  produced a silently inactive rule. A prefix syntax binds the part
  reference and the event name into one identifier that the validator
  resolves as a single unit.
- **Not unprefixed event names (`click`, `escape`).** Without a
  prefix the reader cannot tell whether `click` means "click on the
  part declaring this state," "click on the trigger sibling," or
  "click anywhere outside the floating element." All three are common
  in overlay specs; the prefix makes the intent self-describing.
- **Not free-form event names (no vocabulary).** Open vocabularies
  reintroduce the `tigger` / `focusIn` / `clik` typos that PR review
  was catching in the old `interactions:` block. Closed vocabularies
  with suggestion-on-miss have already proven themselves for event
  verbs (ADR-0019); extending the pattern to DOM events and key names
  is the same trade.
- **Not a separate `timer:` source prefix.** A timer is not an
  external event; it is a scheduling concern internal to the
  transition. Putting it on a transition's `after:` field models it
  as the modifier it is and keeps the source vocabulary tied to
  things that originate outside the machine.

## Consequences

- `specs/_vocabulary.yaml` gains `dom_events:` and `keys:` blocks.
  The verb-vocab `arrowLeft` / `arrowRight` collision with the
  `logical-naming` lint is exempted at the lint-rule level
  (`arrowLeft` is a hardware key name from `KeyboardEvent.key`,
  not styling direction).
- The validator gains rules for source-prefix resolution: part name
  exists, DOM event in the registered vocabulary, key in the registered
  vocabulary, `outside.*` only on overlay parts. All landed in
  `checkStateMachines` (`codegen/src/semantic-checks.ts`),
  replacing the deleted `checkInteractionEventVocabulary` rule.
- Authors get suggestion-on-miss for every source: `clik` →
  "did you mean click?", `key.scape` → "did you mean key.escape?"
- The codegen runtime resolves `outside.*` through `useOverlay`'s
  existing dismissable-layer wiring; `key.*` resolves through a
  capture-phase document listener; `<part>.<event>` resolves through
  the wrapper's React/Vue event-prop binding on the named part.
- Future composite specs (Combobox, Popover, Menu) reuse the same
  vocabulary without spec-format work. New DOM events or keys land
  by extending `_vocabulary.yaml`, not by changing the schema.

## References

- [RFC-0007](../RFC/0007-spec-structural-readability.md) — the
  design pass; section "Event-source prefix syntax" enumerates the
  three forms.
- [ADR-0019](0019-closed-vocabularies-for-events.md) — the closed-
  vocabulary pattern this ADR extends to DOM events and keys.
- [ADR-0020](0020-states-live-on-parts.md) — the host structure
  these source prefixes appear inside.
- [ADR-0024](0024-part-name-uniqueness.md) — the uniqueness
  guarantee that lets `<part>.<event>` resolve without a fully
  qualified path.
