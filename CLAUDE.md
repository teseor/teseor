# Teseor — Claude operating manual

`docs/` is the source of truth. This file lists the few behaviors a session has
to honor before opening any other file. Tooling enforces the rest — read the
configs (`biome.json`, `.stylelintrc.cjs`, `tsconfig.json`, `lefthook.yml`,
`.github/workflows/`) to learn the constraints, not this file.

## Behaviors tooling can't enforce

- Never bypass hooks or linters (`--no-verify`, deleting checks, etc.). If a
  hook fails, fix the underlying issue.
- No emojis. No AI-tool references in code, commits, PRs, or docs.
- All artifacts in English.

## PR shape

- Closes ≥ 1 issue (`Closes #N`). File one first if none exists.
- Conventional-commit title with a project scope.
- Body sections non-empty: `What`, `Why`, `Test plan`, `Out of scope`.
- Squash-merge.

## Workflow

- Capture mid-session TODOs via `/issue-this <description>`, never as inline
  comments in committed files.
- Significant decisions land as ADRs under `docs/ADR/`, not as inline notes.
- Cross-session state lives in `.claude/handover.md` (`Done` / `In progress` /
  `Settled — do not re-decide` / `Next`). Refresh it after each chunk of work;
  read it before starting one. The file is gitignored — maintainer-only.

## Ask before

- UI / visual decisions on new components.
- Breaking changes to public API (class names, public tokens, prop renames).
- Removing components, tokens, or themes.
- Modifying ADRs.

## Pointers

- Rules → `docs/rules/`
- Architecture → `docs/architecture/`
- Process → `docs/process/`
- Roadmap → `docs/roadmap.md`
- Slash commands → `.claude/commands/`

## Drift policy

If this file disagrees with `docs/`, the file is stale. Open a PR fixing it.
