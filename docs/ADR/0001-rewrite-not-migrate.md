# ADR-0001 — Rewrite, don't migrate

- **Status:** Accepted.
- **Deciders:** repo owner (letanure).

## Decision

Rewrite from scratch and force-push as `main` onto `github.com/teseor/teseor`. Before the force-push, snapshot the current `main` to a `legacy/v2` branch and tag it `pre-rewrite-archive`. The prior history stays accessible from the same repo (`git checkout legacy/v2`, GitHub UI tag picker, per-commit Actions runs). PRs and Issues survive — they're tied to commits and to the repo, not to branch refs.

## Why rewrite rather than continue

- The SCSS build step is dead weight once `var()` fallbacks replace `#{t.$var}` literals.
- Renaming the public class prefix is a coordinated breaking change across every component, test, doc, and consumer reference. Cheaper as a fresh start than as a migration with backwards-compatibility shims.
- The codegen source format changes from JSON to per-component YAML (see ADR-0002). Continuing in place would mean shipping both formats in parallel for at least one release cycle.
- A fresh `docs/` tree with a single source per rule prevents the doc-drift failure mode that plagued the prior repo.

## Consequences

- `github.com/teseor/teseor` keeps its history on `legacy/v2`. The rewrite force-pushes onto `main`. PRs, Issues, and Actions run history survive.
- Old code stays browsable via `git checkout legacy/v2` or the GitHub branch picker.
- Issues that need to live in the rewrite scope are re-tagged or recreated; the old ones don't move.

## Starting npm versions

All `@teseor/*` packages publish at **3.0.0** as a synchronized launch. The floor is forced by `@teseor/css@2.5.2` already existing on the GitHub Packages registry from the prior version line (npm versions are immutable per release rules); we honor it with a major bump for `@teseor/css` and bring every other package up to the same line.

| Package | Starting version |
| --- | --- |
| `@teseor/css` | 3.0.0 |
| `@teseor/contract` | 3.0.0 |
| `@teseor/react`, `vue`, `svelte`, `angular`, `webc` | 3.0.0 |
| `@teseor/i18n` | 3.0.0 |
| `@teseor/primitives` (v0.3+) | 3.0.0 |

**Versions stay synchronized going forward.** Changesets runs in "fixed" mode — `.changeset/config.json` lists all `@teseor/*` packages in one fixed group; a bump to any package triggers the same bump across all. Consumers see one version line; cross-package mismatches are impossible.

**Project milestones decouple from npm versions.** "v0.1 Foundation / v0.2 Button / v0.3 Atoms" in the roadmap are *rewrite phases*, not package versions. The first published release (post-PR-#1 scaffold) is `@teseor/*@3.0.0`; later releases bump per the changeset semantics.
