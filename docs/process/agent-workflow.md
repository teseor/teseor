# Agent workflow discipline

Rules that exist because Claude (and humans) drift without enforcement. Five layers, ordered softest to hardest:

| Layer | Mechanism | What it catches |
| --- | --- | --- |
| **1. Project CLAUDE.md** | Static file Claude reads at session start | Drift on rule recall; "always do X / ask before Y" reminders |
| **2. Slash commands** | `.claude/commands/*.md` | Skips workflow steps when a single command bakes the whole flow |
| **3. Lefthook hooks** | `lefthook.yml` `commit-msg` and `pre-push` | Non-conventional commit messages; missing lint locally |
| **4. GitHub Action gates** | `.github/workflows/pr-discipline.yml` | PRs that skip issue links, title format, body sections, labels |
| **5. Branch protection** | GitHub repo settings | Anything red on `main` |

## Project `CLAUDE.md`

One screen (≤ 100 lines) at the repo root. **Not** a copy of `docs/` rules; a navigation index plus the few rules that Claude needs even before opening any other file.

Structure:

```markdown
# Teseor — Claude operating manual

## Non-negotiables
- lefthook for git hooks. Never husky.
- Stylelint never bypassed. `--no-verify` is forbidden.
- No emojis. No AI references in code, commits, PRs, docs.
- Named exports only. No default exports.
- All code, comments, docs in English.

## Always do
- Every PR: link an issue (`Closes #N`), include a changeset, pass CI, squash-merge.
- Every PR: ≤500 LOC handwritten; 1–3 issues; conventional-commit title with Teseor scope.
- Every PR: filled body sections (What / Why / Test plan / Out of scope).
- Capture mid-session TODOs with `/issue-this <description>` — never leave them as `TODO` comments.
- Significant decisions land as ADRs in `docs/ADR/`, not as inline notes in code or scattered prose.

## Ask before
- UI / visual decisions on new components.
- Breaking changes to public API (class names, public tokens, prop renames).
- Removing components, tokens, themes.
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
If `CLAUDE.md` and `docs/` disagree, **`docs/` wins**. Open a PR fixing whichever is stale.
```

The file is intentionally a thin index. Claude reads `CLAUDE.md` first, then the relevant `docs/` file. Putting rules in two places creates drift; `CLAUDE.md` defers in every conflict.

## Slash commands

Four commands at `.claude/commands/*.md`. Each is a Markdown file with a brief workflow Claude follows when invoked. Project-local, version-controlled, reviewed in PRs.

### `/work-on <issue-number>`
- Read the issue (`gh issue view <n>`)
- Confirm scope with the user
- Create a branch named `feat/<n>-<slug>` or appropriate type
- Apply path-based labels via the labeler
- Begin the work, posting incremental updates

### `/done`
- Run `pnpm lint && pnpm typecheck && pnpm test` (lefthook covers locally but verify)
- Run `pnpm changeset` and write the changeset entry
- Push the branch
- Open the PR via `gh pr create` with the body template pre-filled (What / Why / Test plan / Out of scope; Closes #N pre-populated from branch name)
- Confirm CI is green before requesting review

### `/ship`
- Verify CI green + reviews approved
- Squash-merge via `gh pr merge --squash --delete-branch`
- Close linked issues
- Post a brief confirmation

### `/issue-this <description>`
- Draft a title and body from the description
- Confirm with the user
- Run `gh issue create --title ... --body ... --label "type:chore"` (or appropriate type)
- If invoked from a working branch, add a comment linking to the branch
- Used to capture mid-session TODOs before they become tech debt in `TODO` comments

### `/new-component <name>`
- Reads `docs/rules/component-shape.md` + `specs/_vocabulary.yaml` for the canonical structure
- Asks the user `kind: atomic` or `composite` (and any other contextual choices)
- Creates: `specs/<name>.yaml` (with required fields + canonical vocabulary), `packages/css/src/components/<name>/<name>.css` (skeleton with both sublayers + scoped reset + acid-test-passing fallback chain), placeholder Vitest + Playwright tests
- Replaces the dropped standalone `pnpm new:component` scaffolder (see `process/dev-scripts.md` § "What we dropped") — agent reads current docs, never a stale embedded template
- Does NOT run codegen. The author edits the spec + CSS, then runs `pnpm gen` when ready

These are the only sanctioned shortcuts. PRs created outside `/done` still pass the same gates — they just take more manual steps.

## Lefthook additions (commit-msg)

Added to `lefthook.yml` (alongside the existing pre-commit and pre-push hooks; see `process/dev-scripts.md` § "External tooling" for the lefthook entry):

```yaml
commit-msg:
  commands:
    conventional:
      run: |
        if ! head -n1 "{1}" | grep -qE '^(feat|fix|perf|refactor|docs|chore|test)\([a-z0-9-]+\): .+'; then
          echo "Commit message must follow conventional-commit format"
          echo "Examples:  feat(button): add loading state"
          echo "           chore(repo): bump lefthook to 1.7"
          exit 1
        fi
```

Catches drift before the commit lands. Bypass via `--no-verify` is forbidden (project `CLAUDE.md`); the GitHub Action gate catches any commit that slipped through.

## GitHub Action gates — `.github/workflows/pr-discipline.yml`

Single workflow with four jobs that run on PR `opened`, `edited`, `synchronize`:

**1. `linked-issue`** — fails if PR body doesn't match `(Closes|Fixes|Refs) #\d+`. Skip allowed via `no-issue` label (auditable).

**2. `title-format`** — fails if PR title doesn't match the conventional-commit regex. Scope list is built at run-time: union of component names from `specs/*.yaml` + fixed scopes (`token`, `theme`, `codegen`, `showcase`, `css`, `wrapper`, `i18n`, `ci`, `repo`). This means adding a new component automatically extends the allowed scopes.

**3. `body-sections`** — fails if PR body is missing `## What`, `## Why`, `## Test plan`, or `## Out of scope` headings, OR if any section is empty (the heading exists but has no content).

**4. `labeler`** — runs `actions/labeler@v5` against `.github/labeler.yml`. Applies path-based labels. Not a gate; just a side effect.

### `.github/labeler.yml`

```yaml
"area:css":
  - changed-files:
      - any-glob-to-any-file: "packages/css/**"
"area:react":
  - changed-files:
      - any-glob-to-any-file: "packages/react/**"
"area:vue":
  - changed-files:
      - any-glob-to-any-file: "packages/vue/**"
"area:svelte":
  - changed-files:
      - any-glob-to-any-file: "packages/svelte/**"
"area:angular":
  - changed-files:
      - any-glob-to-any-file: "packages/angular/**"
"area:webc":
  - changed-files:
      - any-glob-to-any-file: "packages/webc/**"
"area:spec":
  - changed-files:
      - any-glob-to-any-file: "specs/**"
"area:docs":
  - changed-files:
      - any-glob-to-any-file: "docs/**"
"area:ci":
  - changed-files:
      - any-glob-to-any-file: ".github/workflows/**"

# Per-component labels (auto-generated entries; one per spec)
"component:button":
  - changed-files:
      - any-glob-to-any-file:
        - "packages/css/src/components/button/**"
        - "specs/button.yaml"
# … one entry per spec file …
```

Per-component entries are generated by `scripts/sync-labels.ts` from `specs/*.yaml` on every spec change. CI gate ensures the generated portion of `labeler.yml` matches the current spec list (similar to `gen-drift`).

## Stale-branch action

`.github/workflows/stale.yml` runs daily via `actions/stale@v9`:

- **PR with no activity for 10 days** → bot comments warning
- **PR with no activity for 14 days** → bot closes PR, deletes branch
- **Exempt:** label `do-not-stale` (used sparingly for spike branches)
- **Issues** are not staled — the rule applies to PRs only. Issues accumulate as backlog signal; staling them loses information.

## Required branch protection on `main`

Configured once via GitHub repo settings (or `gh api` script in repo setup):

- All workflows passing
- 1 approving review (post-v1.0; pre-v1.0 the maintainer self-merges)
- No force-push, no direct push
- Linear history (squash-merge enforces this)
- Branch deleted after merge

## Combined effect

A PR cannot land on `main` if any of these is wrong:
- Missing `Closes #N` in body
- PR title not conventional-commit
- Missing body sections
- Any CI gate red (lint, typecheck, test, visual, a11y, bundle, gen-drift, changeset)
- Branch stale (> 14 days)

This is the enforcement loop. The discipline doesn't depend on Claude (or any contributor) remembering — the gates remember for them.

## Sources

- `pr-shape.md` (the shape the gates enforce)
- `ci-gates.md` (the CI surface this composes with)
