Start work on a GitHub issue. Argument: the issue number.

## Workflow

1. `gh issue view $ARGUMENTS --json title,body,labels,milestone` — load the issue.
2. Summarise the scope in one sentence and confirm with the user before touching anything.
3. Pick a branch prefix based on the issue's `type:*` label:
   - `type:feature` → `feat/`
   - `type:fix` → `fix/`
   - `type:chore` → `chore/`
   - `type:docs` → `docs/`
4. Slug the issue title (lowercase, dashes, no punctuation, ≤ 50 chars). Branch
   name: `<prefix>/v0.1-<slug>` or `<prefix>/<n>-<slug>` if no milestone scope
   makes sense.
5. `git checkout main && git pull origin main && git checkout -b <branch>`.
6. Begin the work, posting incremental updates to the user.

## Failure modes

- **Issue is closed or has no milestone**: confirm with the user whether to
  proceed; closed issues should not silently spawn new branches.
- **Branch already exists locally or remote**: stop, ask the user whether to
  resume that branch or pick a new name. Never force-overwrite.
- **`main` is behind origin and has uncommitted changes**: stash or stop. Do
  not force a fast-forward over user state.
- **Working tree dirty on `main`**: stop and surface the diff to the user
  before switching branches.
