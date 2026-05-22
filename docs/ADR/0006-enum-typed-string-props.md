# ADR-0006 — Enum-typed string props

- **Status:** Accepted.
- **Deciders:** repo owner (letanure).

## Decision

A `props:` entry may declare `values: [...]` — a closed set of accepted
strings. When present, `gen-contract`, `gen-react`, and `gen-vue` emit a typed
union (`type StackAlign = "start" | "center" | "end" | "stretch"`) and type the
prop with it instead of bare `string`. `values:` is opt-in: props that accept an
open set — `gap` takes any spacing-token suffix — keep `type: string` with no
`values:`.

## Why `values:` and not the alternatives

- **Not a new `type: enum`.** The prop is still a string at runtime — the CSS
  attribute selector is the runtime contract. `type: string` + `values:` keeps
  the runtime type honest while adding compile-time narrowing; a distinct `enum`
  type would imply a different runtime representation.
- **Not `constraints:`.** Constraints express cross-prop mutex rules. A closed
  value set is a single-prop property — a different concern, a different shape.
- **Not JSDoc-only (the status quo).** Listing accepted values in the
  `description:` gave no compile-time safety, and the list drifted silently from
  the CSS. The type system should carry the contract.

## Consequences

- Spec authors choose, per string prop, between an open set (`type: string`) and
  a closed one (`+ values:`). The choice is visible in review.
- The accepted-value list lives in exactly one place — the spec — and flows to
  the generated types, the docs, and (eventually) `validate-spec.ts`.
- The generated type name is `${Component}${Prop}` (`StackAlign`,
  `ClusterJustify`). Adding a value is a minor change; removing one is a breaking
  change, same as any union narrowing.
- `@teseor/contract` exports these unions; the React and Vue wrappers inline
  them (non-exported), consistent with the existing "contract is the canonical
  type surface" split. Widening the wrapper exports is tracked separately.
