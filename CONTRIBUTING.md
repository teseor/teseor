# Contributing

Thanks for considering a contribution.

## File an issue first

Every PR closes at least one issue. If none exists, file one with the
appropriate template (`Bug`, `Feature`, `RFC`) at
https://github.com/teseor/teseor/issues/new/choose.

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
pnpm test       # unit, visual, a11y
```

See `docs/process/dev-scripts.md` for the full script catalog.

## Path-specific guidance

Per-area conventions (CSS, codegen, specs, framework wrappers, docs,
i18n) live in `docs/process/contribution-paths.md`. Read the section
matching your change before opening the PR.

## Code of conduct

By participating, you agree to the `CODE_OF_CONDUCT.md`.
