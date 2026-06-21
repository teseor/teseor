# ADR-0024 — Part names are unique across the parts tree

- **Status:** Accepted (2026-06-20). Implementation shipped in PR #872.

## Decision

Within a single spec, every part name in the parts tree must be
unique. Two parts with the same name — whether siblings, nested
under different ancestors, or at different depths — are rejected by
the validator with the full set of declaration paths in the error
message. The rule applies recursively through any depth of
`parts.X.parts.Y.parts.Z`.

The uniqueness lets `<part>.<event>` source-prefix references
(ADR-0021) and `<part>.<bool-prop>` guard references (ADR-0022)
resolve through a single flat lookup, with no need for
fully-qualified dotted paths.

## Why this and not the alternatives

- **Not fully-qualified path syntax**
  (`<ancestor>.<part>.<event>`). Verbose for the common case (every
  current and planned spec has a flat-enough tree that ambiguity
  never arises) and brittle on rename (renaming an ancestor breaks
  every transition source under it). Uniqueness costs the spec
  author one rename decision per collision; qualified paths cost
  every source reference everywhere.
- **Not scoping resolution to the part declaring the transition.**
  Modal's `content.states.open.on['trigger.click']` already needs to
  reach the sibling `trigger` part; scoping to "self only" forbids
  the common case the source-prefix syntax exists to express.
- **Not "ambiguous names resolve to the closest part."** Subtle
  scoping rules surprise authors and reviewers; a reader cannot tell
  which `trigger` a source references without walking the parts
  tree. Uniqueness is the cheap, mechanical alternative.
- **Not "warn on duplicates, accept the spec."** Warnings are
  ignored; the resolution ambiguity then surfaces as a runtime
  surprise (the wrong part responds to the event). Rejecting at
  validation time forces the author to pick a name before the
  ambiguity ships.

## Consequences

- `checkStateMachines` walks the parts tree once at the start of
  validation, accumulates a `partNameOccurrences` map keyed by name
  with the full declaration paths as values, and rejects any name
  that appears more than once. The error message lists every path
  so the author can see both sites without a second validator run.
- Authors rename one of the collisions when adding a new nested
  part. The naming convention `parts.X.parts.Y` is shallow enough
  in current specs (Modal has two top-level parts, Tooltip two,
  Pagination one, Tablist one nested layer) that collisions are
  rare in practice. Future deeper trees (DataTable's
  `table.body.row.cell` plus `table.header.row.cell`) need
  distinct names per row depth (`bodyRow` / `headerRow`).
- The rule is independent of the file format. A future migration to
  a different config shape (TOML, JSON, generated from TS) preserves
  the constraint as long as it preserves the parts tree.
- The rule does not apply across specs. Two specs can both declare a
  `trigger` part; `<part>.<event>` is resolved per spec, not
  globally.

## References

- [RFC-0007](../RFC/0007-spec-structural-readability.md) — sections
  "Event-source prefix syntax" and "Validator additions" cite the
  uniqueness rule.
- [ADR-0021](0021-event-source-prefix-syntax.md) — the source-prefix
  syntax that relies on this guarantee.
- [ADR-0022](0022-minimal-when-guard-grammar.md) — the guard
  grammar that relies on the same guarantee.
- [ADR-0020](0020-states-live-on-parts.md) — the host structure for
  the parts tree this rule walks.
