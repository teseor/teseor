# Contributing to Teseor

## Development setup

```bash
git clone https://github.com/teseor/teseor.git
cd teseor
pnpm install
pnpm dev                   # docs dev server at localhost:3000
```

Requires Node 22+ and pnpm 9+.

## Workflow

1. **Create a GitHub issue** with clear scope
2. **Branch** from main: `feat/`, `fix/`, `docs/`, `chore/`, `refactor/`, `test/`
3. **Implement** with granular commits
4. **Add a changeset** for user-facing changes (`pnpm changeset`)
5. **Push and open a PR** -- CI must pass before merge
6. **Merge** to main
7. The release workflow auto-creates a version PR; merging it publishes to npm

## Commit convention

```
[CSS] type(scope): message
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`

Single line only. Put details in the PR body. Enforced by commitlint in CI.

## Branch rules

- PRs required -- no direct pushes to main
- Status checks must pass -- Lint, Test, Typecheck, Changeset, Lighthouse, Visual Tests
- Linear history -- rebase only, no merge commits
- No force pushes or branch deletions

## Project structure

```
packages/css/src/
  config/            # Layer order (layers.scss), design tokens (tokens/), guides (guides/)
  reset/             # CSS reset
  base/              # Base HTML element styles
  layout/            # Layout primitives (grid, column, row, box, sidebar-nav, ...)
  components/        # UI components grouped by category
    actions/         # button, button-group, close-button
    typography/      # heading, link, code, code-block, kbd, blockquote, list, mark
    forms/           # input, select, checkbox, radio, toggle, slider, field, ...
    data-display/    # avatar, badge, card, table, tag, stat, icon, image, ...
    feedback/        # alert, spinner, progress, progress-circle, skeleton, toast
    overlays/        # modal, dialog, drawer, tooltip, popover, overlay
    disclosure/      # accordion, disclosure
    navigation/      # tabs, breadcrumb, menu, dropdown-menu, nav, pagination
    content/         # divider, spacer, scroll-area
  utilities/         # Helper classes
  debug/             # Dev tools
apps/docs-css/       # Documentation site (Eleventy)
```

Components are auto-discovered from directory structure -- no manual registration needed.

## Running tests

```bash
pnpm lint              # biome + stylelint + custom lints + docs validation
pnpm typecheck         # typescript
pnpm test:unit         # vitest
```

### Visual regression tests

Visual snapshots must match the CI environment. Always update via Docker:

```bash
./scripts/visual-test-docker.sh                    # run all visual tests
./scripts/visual-test-docker.sh --update           # update all snapshots
./scripts/visual-test-docker.sh --update button    # update specific component
./scripts/visual-test-docker.sh --stop             # stop the container
```

### Lighthouse CI

Runs on every PR, auditing 4 docs pages. Minimum scores: performance 0.8, accessibility 0.85, best practices 0.9, SEO 0.9. Config in `lighthouserc.json`.

## Adding a component

Create a folder under the appropriate category in `packages/css/src/components/` with 4 files:

- `index.scss` -- styles (use `--_` prefix for internal tokens)
- `<name>.api.json` -- CSS API definition
- `<name>.docs.json` -- documentation (use `items` config format, not raw HTML)
- `<name>.visual.spec.ts` -- visual regression test

### Style conventions

- **Token fallback pattern**: `var(--ui-component-token, var(--ui-global-token, #{$fallback}))`
- **Internal variables**: `--_` prefix for component-scoped vars
- **Layers**: components split into `components.tokens` and `components.styles`
- **BEM naming**: `.ui-block--modifier`, `.ui-block__element`
- **No magic numbers**: always reference design tokens

## Changesets

Add a changeset for any user-facing change:

```bash
pnpm changeset
```

Package name: `@teseor/css`. Skip changesets for docs-only, CI/tooling, or internal refactors.

When merged to main, the release workflow collects changesets into a version PR. Merging that PR publishes to npm and creates a GitHub release.

## Labels

Auto-applied via `.github/labeler.yml`:
- `pkg: css`, `pkg: docs-css`
- `type: ci`, `type: docs`, `type: feature`, `type: bug`, `type: refactor`, `type: test`
