# Architecture decision records

ADRs are Teseor's decision log. Anything load-bearing — a structural
choice, a constraint, a "we considered X and rejected it" — lands here as
a numbered, durable file.

## Index

| # | Title | Status |
| --- | --- | --- |
| [0001](0001-rewrite-not-migrate.md) | Rewrite, don't migrate | Accepted |
| [0002](0002-per-component-yaml-over-manifest.md) | Per-component YAML over a single manifest | Accepted |
| [0003](0003-postcss-build-step.md) | PostCSS build step (literal floors) | Accepted |
| [0004](0004-practical-strict-semver.md) | Practical strict semver | Accepted |
| [0005](0005-adrs-are-the-decision-log.md) | ADRs are the decision log | Accepted |
| [0006](0006-enum-typed-string-props.md) | Enum-typed string props | Accepted |
| [0007](0007-astro-for-the-docs-site.md) | Astro for the docs site | Accepted |
| [0008](0008-token-driven-component-css.md) | Token-driven component CSS | Accepted |
| [0009](0009-spec-schema-and-validation.md) | Spec schema and validation | Proposed |
| [0010](0010-coverage-expansion-pairwise.md) | Coverage expansion: pairwise for contract fixtures | Proposed |

## When to write one

Write an ADR when a decision satisfies any of:

- **Constrains future PRs.** Anyone working on the touched surface needs
  to know the rule to avoid relitigating it.
- **Rejected a real alternative.** The reasoning matters more than the
  outcome; the next contributor will hit the same fork and need the same
  context.
- **Changes how a public surface behaves.** Class names, public tokens,
  prop renames, package boundaries, version policy.
- **Is non-obvious from the code.** If reading the source doesn't explain
  *why* — write the ADR. If it does, skip it.

If a decision is local to one PR and has no future consequence, the PR
description is enough. ADRs are for choices that have to survive past
the PR that introduced them.

## What an ADR is not

- **Not an RFC.** RFCs (`docs/RFC/`) explore proposals before a decision
  is made. ADRs record decisions after they're made. An RFC may produce
  an ADR; an ADR never produces an RFC.
- **Not a changelog entry.** `CHANGELOG.md` (generated from changesets)
  tells consumers what shipped. ADRs tell contributors why we built it
  this way.
- **Not a session note.** Notes about an in-flight task belong in
  `.claude/handover.md` (maintainer-only) or a working branch — not
  committed under `docs/ADR/`.

## Shape

Each ADR is one file, kebab-cased after its number:
`<NNNN>-<short-slug>.md`. Numbers are assigned in commit order. Never
reuse a number; never reorder existing files.

Required sections, in this order:

```markdown
# ADR-NNNN — <Title>

- **Status:** <Proposed | Accepted | Superseded by ADR-XXXX | Deprecated>.
- **Deciders:** <names or roles>.

## Decision

One paragraph. State the outcome — not the discussion.

## Why <this> and not <that>

Bulleted. Each bullet is one reason, terse.

## Consequences

What the project now has to live with. Wins AND costs.
```

Optional sections (use when relevant): `Context`, `Alternatives
considered`, `Open questions`, `References`.

## Modifying an existing ADR

The bar is high. ADRs are durable. Three patterns:

1. **Superseding.** A new ADR replaces an old one. The old ADR's status
   flips to `Superseded by ADR-NNNN`; its body stays intact for the
   historical record. The new ADR cites the old one in its `References:`.
2. **Deprecating.** A constraint is no longer in force but no replacement
   is needed. Status flips to `Deprecated`; body stays intact; a one-line
   header notes the PR that retired it.
3. **Correcting a factual error.** Edit in place with a footnote
   acknowledging the correction. Don't rewrite the reasoning — that's a
   supersede.

Never silently rewrite an ADR. Project `CLAUDE.md` lists modifying an ADR
under the "Ask before" gate; this paragraph is why.
