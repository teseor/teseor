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

## Happy path for new contributors

If you only read one flow, read this one:

1. Read `docs/architecture/at-a-glance.md`.
2. Pick the matching change path in `docs/process/contribution-paths.md`.
3. Run the minimum local checks for your change:
   - all changes: `pnpm lint && pnpm typecheck && pnpm test`
   - spec or codegen changes: also run `pnpm gen`
   - browser-contract changes: also run `pnpm test:e2e`
4. Open a PR that closes an issue and follows the PR shape rules above.

Quick decision tree:

- changing `specs/` → component path + `pnpm gen`
- changing `packages/css/` → component or theme path + `pnpm build:css`
- changing `scripts/codegen/` → codegen change + paired generator tests
- changing `apps/docs/` or `docs/` → docs path + `pnpm lint`
- changing `.github/workflows/` → chore path + validate the workflow shape

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
