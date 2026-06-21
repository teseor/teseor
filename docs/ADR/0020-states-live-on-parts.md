# ADR-0020 — States live on parts, not in a root machine block

- **Status:** Accepted (2026-06-20). Implementation shipped in PR #872.

## Decision

A composite spec declares state machines per part. Each part may carry
a `states:` map; the first declared state is initial; transitions take
the shape `{ to, after, when, emits }` (string shorthand allowed when
only `to` is set). No root `interactions:` block, no root `machine:`
block, no separate state-graph file. The existing descriptive
`states:` field on `componentNodeFields` (Button's `hover` / `focus` /
`active` / `loading`) was renamed `visualStates:` to free the name for
the state-machine block.

Root-level fields removed: `interactions:`, `behavior:`, and the root
`overlay:` field (overlay now lives on the part that is the floating
element).

## Why this and not the alternatives

- **Not a separate root `machine:` block (Zag's shape).** Zag declares
  states next to a `parts:` block joined by string-key matching. That
  is the same cross-block scatter this ADR is fixing — the spec reader
  still has to do the name-match in their head to see "the trigger
  opens the content dialog and the content dismisses via outside /
  escape / button." Adopting Zag's *concepts* (states, transitions,
  emissions) is what makes specs readable; adopting its *config shape*
  is not.
- **Not lighter "wiring on parts, no state model"
  (`onClick: toggle`).** Solves `modal.yaml`. Falls apart for
  `tooltip.yaml` — the open/close delay pair with pointer-and-focus
  companion events has no structural place, forcing per-component
  ad-hoc fields. Defers the same conversation to the next stateful
  component (Combobox, future Popover) instead of resolving it now.
- **Not "leave the spec alone, fix the validator only."** The
  spec-format complexity audit (`docs/research/spec-format-complexity-
  audit.md`) deliberately scoped the validator duplication problem and
  named the cross-block name-matching as out of scope. The author-side
  pain — typos, missing companion rules, references at non-existent
  parts — was what this RFC had to address.

## Consequences

- `componentPart` gains optional `states:` (record of state name →
  `{ on: Record<source, transition> }`) and optional `overlay:` (the
  block formerly at root). The root discriminated union loses
  `interactions:`, `behavior:`, and `overlay:`.
- The existing descriptive `states:` on `componentNodeFields` is
  renamed `visualStates:`. Button's spec carries the one-line rename;
  no other current spec used the field.
- Every composite spec rewrites once. The four specs in tree at the
  time (`modal`, `tooltip`, `pagination`, `tablist`) moved together in
  PR #872; `pagination` and `tablist` carried no states, so the
  rewrite was just removing the root `behavior:` line.
- The validator rewrites alongside. Old rules policing the root
  blocks (`checkInteractionRefs`, `checkOverlayEscapeRules`,
  `checkInteractionEventVocabulary`) were deleted; the new
  `checkStateMachines` walks the parts tree and resolves
  `<part>.<event>` source prefixes, transitions, guards, and
  `emits:`.
- ADR-0009's root-only / part-only placement rules for `overlay:` and
  `interactions:` are partially superseded. The schema-and-validation
  decision itself stays; only the field-placement specifics flip.
- A part's state-machine block coexists with its visual-state block.
  A future composite can declare both — the state machine drives
  behavior, the visual states drive CSS — without collision.

## References

- [RFC-0007](../RFC/0007-spec-structural-readability.md) — the design
  pass; this ADR records the load-bearing structural decision.
- [ADR-0009](0009-spec-schema-and-validation.md) — the existing
  schema-and-validation ADR; partially superseded by the field
  placement changes recorded here.
- [ADR-0018](0018-events-block-surface.md) — the events surface this
  RFC preserves unchanged; per-transition `emits:` reference the same
  root `events:` block ADR-0018 introduced.
- [#867](https://github.com/teseor/teseor/issues/867) — the RFC-0007
  implementation issue, closed by PR #872.
