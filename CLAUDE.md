# Teseor — Claude operating manual

This file is a thin navigation index, not a copy of the rules. When `CLAUDE.md` and
`docs/` disagree, `docs/` wins — open a PR to fix whichever drifted.

## Non-negotiables

- lefthook for git hooks. Never Husky.
- Stylelint never bypassed. `--no-verify` is forbidden.
- No emojis. No AI-tool references in code, commits, PRs, or docs.
- Named exports only. No default exports.
- All code, comments, and docs in English.

## Always do

- Every PR: link an issue (`Closes #N`), include a changeset when `packages/`
  changes, pass CI, squash-merge.
- Every PR: ≤ 500 LOC handwritten, 1–3 issues closed, conventional-commit title
  using a Teseor scope.
- Every PR body fills these sections, non-empty: `What`, `Why`, `Test plan`,
  `Out of scope`.
- Capture mid-session TODOs with `/issue-this <description>` — never leave them
  as `TODO` comments in committed files.
- Significant decisions land as ADRs in `docs/ADR/`, not as inline notes in
  code or scattered prose.

## Ask before

- UI / visual decisions on new components.
- Breaking changes to public API (class names, public tokens, prop renames).
- Removing components, tokens, or themes.
- Modifying ADRs.

## Pointers

- Canonical rules → `docs/rules/`
- Architecture → `docs/architecture/`
- Process → `docs/process/`
- Roadmap → `docs/roadmap.md`
- Slash commands → `.claude/commands/`
- Contribution paths → `docs/process/contribution-paths.md`
- Migration walkthrough → `docs/process/migrations-end-to-end.md`
- RFC template → `docs/RFC/_template.md`

## Drift policy

If `CLAUDE.md` and `docs/` disagree, `docs/` wins. Treat anything here that
contradicts a current `docs/` file as the bug, and open a PR fixing whichever
is stale.
