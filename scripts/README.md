# scripts/

Repository-level tooling. Layout is role-based: the folder tells you who calls the script and when. See ADR-0014 for the design rationale.

## Layout

| Folder | Role | Entry point |
| --- | --- | --- |
| `lint/` | Every project lint check. The registry (`lint/registry.ts`) catalogues all of them; the runner (`lint/run.ts`) dispatches. | `node scripts/lint/run.ts --all` (or `pnpm lint`) |
| `lint/file-rules/` | Per-file scanners — `(file, source) -> ViolationDetail[]`. | Registered in `lint/registry.ts`. |
| `lint/cross-file/` | Workspace invariants (multiple package.jsons, doc tree, contract snapshots). | Registered in `lint/registry.ts`. |
| `lint/diff-aware/` | Reasons over the changed-file set vs the PR base. | Registered in `lint/registry.ts`. |
| `lint/helpers/` | Shared helpers (git diff, file enumeration, repo root, reporter) imported by every check. | None — library code. |
| `hooks/` | Git-hook helpers called directly by lefthook. | `lefthook.yml`. |
| `maintenance/` | One-shot maintainer ops (sync labels, migrate specs, branch protection, pre-flight review). | Direct invocation. |

The `codegen/` workspace package (spec-to-artifact generators) lives at the repo root, not under `scripts/`. See `codegen/` for its own README.

## Adding a new lint check

1. Pick the folder by shape: per-file → `lint/file-rules/`; workspace invariant → `lint/cross-file/`; diff-aware → `lint/diff-aware/`; subprocess (third-party tool, `.js` helper) → declare as `external` directly in the registry.
2. Implement the check function. Pure shape: take input, return `ViolationDetail[]`. For external commands, just declare the `command:` string.
3. Add one entry to `scripts/lint/registry.ts` keyed by the rule name (kebab-case). Include `triggers` (lefthook-style globs) so the runner can skip the check when no matching file is staged.
4. That's it. The runner picks it up automatically; lefthook is wired once via `--all`; `node scripts/lint/run.ts --list` updates.

## Adding a maintainer one-shot

`scripts/maintenance/<verb-or-noun>.ts` (or `.sh` / `.md` for a prompt). No registry, no lefthook entry — these are invoked directly.

## Naming convention

- Kebab-case file names.
- Folder provides the verb context: `lint/file-rules/component-css.ts`, not `lint/file-rules/check-component-css.ts`.
- Repo helpers describe the operation: `migrate-specs.ts`, `sync-labels.ts`, `protect-main.sh`.
- Tests colocate: `foo.ts` ↔ `foo.test.ts`.

## CLI cheatsheet

```bash
pnpm lint                                  # run every registered check
node scripts/lint/run.ts --list            # show the catalog with kinds
node scripts/lint/run.ts --<rulename>      # run one check
node scripts/lint/run.ts --<rulename> f1   # run one file-rule on explicit files
node scripts/lint/run.ts --help
```
