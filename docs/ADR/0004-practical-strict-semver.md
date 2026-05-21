# ADR-0004 — Practical-strict SemVer pre-1.0

- **Status:** Accepted.
- **Deciders:** repo owner (letanure).

## Context

The SemVer spec is explicit about the pre-1.0 range:

> Major version zero (0.y.z) is for initial development. Anything MAY change at any time. The public API SHOULD NOT be considered stable.

Read literally, this means `0.4.5 → 0.4.6` could rename every class, remove every component, and still be a legal patch bump. Many OSS projects pre-1.0 follow this literally; consumers respond by pinning exact versions and treating every update as a potential migration.

Teseor is a design system. Class names (`.t-button`), public tokens (`--t-accent`), and prop names appear in consumer HTML, CSS, and TSX across their entire codebase. A pre-1.0 minor bump that silently renames a class breaks production for every consumer who pinned with `~0.4.x` or `^0.4.0`.

## Decision

Pre-1.0, we respect minor/patch semantics as if we were post-1.0. Specifically:

- **Patch (0.4.5 → 0.4.6):** bug fixes, internal refactors, perf improvements that don't change the public API.
- **Minor (0.4.5 → 0.5.0):** new components, new variants/intents/sizes, new exported functions, new optional props with defaults.
- **Major (0.4.5 → 0.5.0 or 0.4.5 → 1.0.0):** rename a `.t-*` class, rename a `--t-*` public token, remove a variant value, remove a prop, change a visual default in established use cases, narrow a TS return type, widen a TS param type.

Major bumps stay legitimate and frequent pre-1.0 — we're still iterating the API — but they're deliberate, accompanied by migration docs and codemods (per `process/versioning.md`), and never silent.

The interpretation we're rejecting: literal pre-1.0 SemVer where minor and patch carry no contract.

## Why we constrained pre-1.0

**Class names and tokens are pinned in consumer markup.** Unlike a runtime library whose API is called from one or two places, Teseor's public API appears across an entire consumer codebase. A rename without major-bump warning destroys hundreds of search-replace sites.

**Pinning by exact version doesn't work in practice.** Modern package managers default to `^` (caret) or `~` (tilde) ranges. Consumers don't notice an upgrade until something breaks. If we use literal pre-1.0 SemVer, every `~0.4.x` consumer becomes our QA team without consent.

**Practical-strict matches consumer mental models.** Almost every consumer (and most maintainers reading this) assumes minor = non-breaking, even pre-1.0. The literal reading is a SemVer-spec edge case most people don't know exists. We follow the assumption rather than weaponizing the technicality.

## Why this doesn't slow iteration

The argument for literal pre-1.0 SemVer is "we need freedom to iterate the API." Practical-strict gives us the same freedom — we just commit to it by bumping major when we change shape.

In the v0.x range, frequent major bumps are normal. `0.4 → 0.5 → 0.6` is healthy iteration. Each bump:
- Is announced via the changelog
- Ships migration docs auto-built from changeset frontmatter (see `process/versioning.md` § "Migration guides")
- Ships a codemod for mechanical renames (see `process/versioning.md` § "Codemods")
- Lets consumers upgrade with `npx @teseor/codemods/0.4-to-0.5`

The cost of practical-strict is one number in a version string. The benefit is consumers who can pin `~0.4.x` safely throughout the 0.x phase.

## Why this doesn't burden the project

Practical-strict requires nothing beyond what the existing toolchain already enforces:

- **Changesets** make every author declare bump level (patch/minor/major) for their PR.
- **CI** rejects `packages/` changes without a changeset (existing gate, per `ci-gates.md`).
- **The breaking-change taxonomy** is enumerated in `process/versioning.md` § "What counts as breaking" (CSS) and § "For wrappers".
- **Migration docs auto-build** from changeset `migration:` frontmatter.

If anything, practical-strict makes the maintenance loop *easier* than literal-pre-1.0: rules are explicit, choices are documented, and the discipline is the same throughout the project's lifetime instead of changing at the 1.0 boundary.

## Versions are synchronized across packages

All `@teseor/*` packages publish at the same version (changesets "fixed" mode; see ADR-0001 § "Starting npm versions" and `process/release.md`). A breaking change in any one package bumps everything to the next major. Practical-strict still applies — the bump-level rules above govern the *decision* to call something breaking; the sync just propagates that bump across the group so consumers see one version line.

## Consequences

- Consumer pinning with `~0.4.x` or `^0.4.0` is safe — they get bug fixes and added features, never silent breakages.
- Major bumps pre-1.0 are common. The version number reflects API churn honestly.
- Every breaking change costs more than under literal pre-1.0: must ship migration docs, ideally a codemod, deprecation notice if removal was previewed.
- The 1.0 milestone (when it arrives) doesn't change the *rules* — it changes the *cadence*. After 1.0, breaking changes are rare (only at milestone boundaries) instead of routine.
- `docs/process/versioning.md` documents the operational version of this ADR.

## Alternatives considered

**Literal pre-1.0 SemVer.** Rejected for the reasons above — design systems live in consumer markup, pinning ranges are universal in practice, and the literal reading hurts users for marginal maintainer convenience.

**No SemVer at all (date-versioning, like 2026.05.21).** Rejected because date-versioning loses the ability to signal compatibility. Two versions a week apart could be functionally identical or wildly different; consumers can't tell from the version string.

**Calver with semantic suffix (2026.05.x-major).** Hybrid that introduces complexity without solving anything practical-strict SemVer doesn't already solve.

## Sources

- SemVer 2.0.0 specification, item 4 (pre-1.0 clause).
- `process/versioning.md` (operational rules).
- `process/release.md` (release mechanics).
