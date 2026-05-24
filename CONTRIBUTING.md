# Contributing

Thanks for considering a contribution.

## File an issue first

Every PR closes at least one issue. If none exists, file one with the
appropriate template (`Bug`, `Feature`, `RFC`) at
<https://github.com/teseor/teseor/issues/new/choose>.

## Open a PR

- Branch from `main`. Name it `<type>/<issue-number>-<slug>` (for example
  `feat/123-button-loading`).
- Title: conventional-commit format, `type(scope): subject`. See
  `docs/process/pr-shape.md` for scopes.
- Body: fill in **What**, **Why**, **Test plan**, **Out of scope**, and
  `Closes #N`.
- Keep handwritten LOC at or below 500. Generated files do not count.
- Add a changeset (`pnpm changeset`) if `packages/` changed.
- One concern per PR.

PR-discipline CI checks linked issue, title format, body sections, and
labels. See `docs/process/agent-workflow.md`.

## Run locally

Requires Node 24 and pnpm 11.

```bash
pnpm install
pnpm dev        # docs site and watchers
pnpm lint       # Biome, Stylelint, spec validator
pnpm typecheck  # tsc --noEmit
pnpm test       # Vitest across packages
pnpm test:e2e   # Playwright suite (see Playwright browsers below)
```

See `docs/process/dev-scripts.md` for the full script catalog.

### Optional local pre-flight review

`pnpm review` sends the current branch's diff (against `origin/main`) to a
GitHub Models endpoint via the `gh-models` extension and prints suggestions
on:

- Naming overpromise (function name covers more than the implementation).
- Schema vs fixture drift (`as unknown as Spec` hiding missing fields).
- Accessibility semantics (`aria-modal`, `aria-describedby` on the wrong
  element, missing accessible name).
- SSR-hydration patterns (`typeof document !== "undefined"` in JSX).
- Public-API leakage (test-only helpers exported from production modules).
- Cross-file consistency on renames.

```bash
gh extension install github/gh-models
pnpm review
```

`BASE=<ref>` overrides the comparison base (default `origin/main`).
`MODEL=<id>` overrides the model (default `openai/gpt-4o`).

#### Auto-run on every push (opt-in)

Enable the pre-push hook for this clone:

```bash
touch .claude/preflight-review.enabled
```

`pnpm review` then runs as part of `pre-push` and prints suggestions before
the push. **Warn-only** — never blocks. Disable with
`rm .claude/preflight-review.enabled`. The marker file is gitignored, so the
opt-in is per-machine.

### Worktrees

If you use `git worktree`, `core.hooksPath` may inherit from the main repo and
block local lefthook hooks. Unset it inside the worktree:

```bash
git config --local --unset core.hooksPath
```

### Playwright browsers

`pnpm test:e2e` and `pnpm test:visual` need a Chromium install before they can
run locally:

```bash
pnpm exec playwright install --with-deps chromium
```

CI installs browsers per-job: the `test-e2e` job in `ci.yml` runs
`pnpm exec playwright install --with-deps chromium` ahead of `pnpm test:e2e`;
the `visual-tests` workflow runs everything inside
`mcr.microsoft.com/playwright:v1.60.0-jammy`, which ships browsers already.

## Path-specific guidance

Per-area conventions (CSS, codegen, specs, framework wrappers, docs,
i18n) live in `docs/process/contribution-paths.md`. Read the section
matching your change before opening the PR.

## Code of conduct

By participating, you agree to the `CODE_OF_CONDUCT.md`.
