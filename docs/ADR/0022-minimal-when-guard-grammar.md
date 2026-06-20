# ADR-0022 — Minimal `when:` guard grammar

- **Status:** Accepted (2026-06-20). Implementation shipped in PR #872.

## Decision

A transition's `when:` field accepts one of two expression shapes:

- `<part>.<boolean-prop>` — true when the named part declares the
  boolean prop and that prop reads true at the active breakpoint.
- `!<expression>` — negation of any supported expression.

No `&&`, no `||`, no parens, no comparison operators, no arithmetic.
The expression is parsed at validation time; resolution at runtime
reads the responsive prop value through the same machinery
`useOverlay` already uses for the controllable triple.

`<part>` resolves against the parts tree per ADR-0024's uniqueness
guarantee; `<boolean-prop>` must be declared `type: boolean` on the
referenced part.

When a real case appears that requires combinators or comparisons,
a follow-up RFC extends the grammar deliberately. Until then, every
guard the project has seen — modal and tooltip's `disabled` checks —
fits inside `[!]<part>.<bool-prop>`.

## Why this and not the alternatives

- **Not a full expression language (Zag-style guards as JS
  predicates).** Once `&&` and `||` land, parens follow, then
  comparisons, then arithmetic, then function calls. The spec format
  drifts from declarative-and-portable into general-purpose code.
  Every guard in tree today is a single boolean prop check; the
  minimal grammar covers every current and planned composite (Modal,
  Tooltip, Popover, Combobox, Menu).
- **Not hardcoding the `disabled` check (the pre-RFC state).**
  Composite-overlay codegen carried an `Object.hasOwn(spec.props,
  "disabled")` special case that read the prop's responsive value and
  short-circuited transitions. The spec format had no place to declare
  the guard, so the generator had to assume it. Surfacing the guard
  as a first-class `when:` field removes the special case and lets
  other props gate transitions the same way.
- **Not a CEL-style boolean expression language.** CEL covers every
  case but pulls in a parser, a typing layer, and a runtime
  evaluator. Spec files become harder to audit; the validator's
  resolution layer becomes a small interpreter. Speculative
  complexity in service of zero current cases.
- **Not "let authors drop in JS strings"** (`when: '!props.disabled'`
  evaluated at runtime). Inline JS in YAML is unreviewable, untyped,
  and silently divergent between framework outputs. Closed grammar
  with structural resolution is the cost of the readability the rest
  of the format buys.

## Consequences

- `tooltip.yaml` carries `when: '!trigger.disabled'` on the two
  pointer/focus open transitions. The hardcoded special case in
  `scripts/codegen/src/generators/gen-react/kinds/composite-overlay.ts`
  is gone.
- The validator gains a guard-expression parser inside
  `checkStateMachines`. It rejects unknown grammar productions and
  unresolved part / prop names with the same suggestion-on-miss
  surface as the source-prefix vocabulary.
- The codegen runtime reads the guard's referenced prop through the
  responsive-prop accessor that already exists for the controllable
  triple. No new runtime concept.
- The grammar is intentionally small enough that a follow-up RFC can
  extend it without breaking. Authors who hit a real case file an
  issue with the spec that needs the operator; the operator lands
  per documented case.
- Project memory (`feedback_defensive_guards_specific`) reinforces
  the same constraint: guards target the exact condition they mean
  to block, never a broad symptom.

## References

- [RFC-0007](../RFC/0007-spec-structural-readability.md) — sections
  "Transition shorthand" and "Adoption" enumerate the grammar.
- [ADR-0020](0020-states-live-on-parts.md) — the host structure for
  `when:`.
- [ADR-0024](0024-part-name-uniqueness.md) — the resolution
  guarantee for the `<part>` reference.
- [#866](https://github.com/teseor/teseor/issues/866) — visual-state
  vocabulary RFC; future visual-state guards will share this
  grammar.
