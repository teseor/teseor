# ADR-0014 — Scripts layout: role-based subdirectories + single lint runner

- **Status:** Accepted.
- **Deciders:** repo owner (letanure).

## Decision

Reorganize `scripts/` into role-based subdirectories (lib, lint, hooks, repo, codegen) and consolidate every project-specific check behind a single registry runner. `pnpm lint` becomes one command — `node scripts/lint/run.ts --all` — that dispatches every entry in `scripts/lint/registry.ts`. The registry classifies each check into one of four kinds, each handled uniformly by the runner.

```text
scripts/
├── README.md                 # role + entry point per subdir
├── lib/                      # shared helpers: git diff, ls-files, paths, report
├── lint/
│   ├── registry.ts           # the catalog
│   ├── run.ts                # the dispatcher (CLI: --all, --<rulename>, --list)
│   ├── file-rules/           # per-file scanners (no-as-unknown-cast, no-document-typeof, …)
│   ├── cross-file/           # workspace invariants (exports-resolve, script-catalog, …)
│   └── diff-aware/           # reads git diff (codegen-tests, changeset)
├── hooks/                    # git-hook helpers called directly by lefthook
├── repo/                     # one-shot maintainer ops (sync-labels, migrate-specs, review)
└── codegen/                  # unchanged: it's its own package
```

## Kinds and the runner contract

The registry is keyed by rule name (kebab-case). Each value is one of:

| Kind | Input | Run signature |
| --- | --- | --- |
| `file-rule` | one file in isolation | `(file, source) -> ViolationDetail[]` |
| `workspace` | the whole workspace (multiple package.jsons, a directory tree) | `() -> ViolationDetail[]` |
| `diff-aware` | the changed-file set vs the PR base | `(changedFiles) -> ViolationDetail[]` |
| `external` | a subprocess (Biome, stylelint, markdownlint, spec validator, comments.js, logical-naming.js) | declared via `command`; runner shells out, optionally appending staged/enumerated files |

The runner owns enumeration, file reading, glob-based trigger gating, reporting, and exit-code aggregation. Each rule body is pure (or, for `external`, a configured subprocess invocation).

Adding a check is one file under the appropriate subdirectory plus one entry in `scripts/lint/registry.ts`. No `package.json` edit, no `lefthook.yml` edit, no new top-level alias.

## Why this and not the alternatives

- **Not "one big walker that scans every staged file."** Workspace invariants (exports-resolve walks every `package.json`; script-catalog compares the root pkg with the dev-scripts table) and diff-aware checks (codegen-tests reads `git diff …main`) don't fit a per-file iterator. Forcing them into one breaks the fit. Three discriminated variants keep the shape honest.
- **Not "extend Biome with a custom plugin."** Biome 2.x has plugins, but they're per-file linters — the same shape as eslint rules. Roughly half the project's checks are cross-file/workspace and can't be expressed in that model. Same blocker for ESLint plugins.
- **Not 15+ `lint:*` aliases.** Each alias was internally chained from `pnpm lint`; nobody typed `pnpm lint:exports-resolve` by hand. The aliases were dead weight. One `pnpm lint` plus the runner's own `--<rulename>` debug UX covers every legitimate caller.
- **Not "leave external tools (Biome, stylelint, …) out of the registry."** That would keep them as separate top-level aliases, which is the symptom this ADR addresses. Registering them as `kind: "external"` is small (~10 lines) and keeps the runner's `--list` as the single catalog. Their native output (Biome's pretty errors, stylelint's warnings) is forwarded unchanged — no reformatting.
- **Not per-rule lefthook entries.** Lefthook's parallel pre-commit ran 18 entries in parallel; the runner serializes them in one process. For ~20 checks the wall-clock difference is small at the project's current size, and the serial-by-default model is recoverable: the runner can spawn externals concurrently as a follow-up (`Promise.all` over `spawnSync`). The structural simplification is worth the small wall-clock cost.
- **Not a single uniform "Check" type without the kind discriminator.** Erasing the difference between per-file / workspace / diff-aware would force every check to implement a generic interface that doesn't fit it. The discriminator makes the shape explicit at registration time and at the call site.

## Consequences

- **One catalog.** `node scripts/lint/run.ts --list` shows every check. `script-catalog.ts` enforces that `package.json` matches the dev-scripts table; the runner's registry is the source of truth for which checks exist.
- **One npm alias for linting.** `pnpm lint` is the only `lint:*` script. Per-rule debug uses `node scripts/lint/run.ts --<rulename>` directly.
- **One lefthook pre-commit command.** `project` dispatches via `node scripts/lint/run.ts --all {staged_files}`. The runner gates each check on its own trigger pathspecs against the staged list.
- **`commit-msg` and `verify-no-dev-leak` are lefthook-only.** They run outside the lint suite (different lifecycle: commit-msg fires per commit; verify-no-dev-leak runs post-build during pre-push). Called by path from `lefthook.yml`, no npm-script alias.
- **The PostCSS type-augmentation file moves to `scripts/lib/postcss-each.d.ts`** with the other build helpers.
- **The commit-msg lefthook helper renames** from `verify-commit.js` to `scripts/hooks/commit-msg.js` so the file name matches the git-hook name.
- **Two `.js` lints stay JS.** `comments.js` and `logical-naming.js` are registered as `external` Checks rather than rewritten in TypeScript. Conversion is a separate concern.
- **History follows.** All moves use `git mv`; `git log --follow` resolves each file's history through the rename.
- **`scripts/codegen/` is unchanged.** It's a workspace package with its own surface and test layout. The reorg deliberately stops at its boundary.

## When this gets revisited

- **The catalog grows past ~25 entries** and the registry becomes harder to scan. Sort entries by kind, or split per-kind files. Don't introduce a new abstraction — just keep the registry browsable.
- **A check arrives that fits none of the four kinds** (e.g. an interactive prompt). Add a fifth variant rather than overloading an existing one.
- **External tool output formatting becomes a UX problem** — for instance, if Biome's pretty errors and the runner's `<rule>: clean` lines fight each other in a CI log. At that point either suppress the runner's success line for `external` checks (cheap) or split externals back out of the registry (heavier).

## References

- [#644](https://github.com/teseor/teseor/issues/644) — original "reorganize scripts/" tracker (this PR closes it)
- [#726](https://github.com/teseor/teseor/issues/726) — audit of Copilot review categories; the safeguards shipped under #729 (file-rules `no-as-unknown-cast`, `no-document-typeof`; cross-file `exports-resolve`) were the catalyst for codifying the kinds
- [ADR-0008](0008-token-driven-component-css.md) — `component-css` check (`scripts/lint/file-rules/component-css.ts` after this PR)
- [ADR-0012](0012-wrapper-internal-seam.md) — wrapper-internal layering, unrelated to scripts/ but a useful precedent for layered conventions
