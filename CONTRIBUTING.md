# Contributing to Teseor

## Development Setup

```bash
git clone https://github.com/teseor/teseor.git
cd teseor
pnpm install
pnpm nx build css
pnpm --filter docs dev
```

## Branch Rules

Main branch is protected by a ruleset:

- **PRs required** - no direct pushes to main
- **Status checks must pass** - Lint, Test, Typecheck, Changeset, visual-test
- **Linear history** - rebase only, no merge commits
- **No force pushes or deletions**

Bypass: repo admin only (for release bot).

## Workflow

1. **Create GitHub issue** with clear scope
2. **Branch** from main: `feat/`, `fix/`, `docs/`, `chore/`
3. **Implement** with granular commits
4. **Add changeset** if user-facing (`pnpm changeset`)
5. **Push + open PR**, wait for CI green
6. **Merge** to main
7. Release workflow auto-creates a version PR; merging it publishes to npm

## Commit Convention

```
[CSS] type(scope): message
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`

Single line only. Details go in PR body.

## Project Structure

```
packages/css/src/
  00-config/         # Tokens, layers
  01-reset/          # CSS reset
  02-base/           # Base typography
  03-layout/         # Layout primitives
  04-components/     # UI components (grouped by category)
    actions/         # button, button-group
    typography/      # heading, link, code
    forms/           # input, select, checkbox, radio, toggle, field, ...
    data-display/    # avatar, badge, icon, tag, status, card, table, data-list
    feedback/        # alert, spinner, progress, skeleton, toast
    overlays/        # modal, drawer, popover, tooltip, dialog, overlay
    disclosure/      # disclosure, accordion
    navigation/      # tabs, breadcrumb, menu, nav, pagination
    layout/          # divider
  05-utilities/      # Utility classes
  99-debug/          # Debug overlays
apps/docs/           # Documentation site (Eleventy)
```

## Running Tests

```bash
pnpm test            # all tests
pnpm lint            # biome + stylelint + component lint
pnpm typecheck       # typescript
```

Visual regression tests need the docs server:

```bash
pnpm --filter docs dev                              # start server
npx playwright test --config=packages/css/playwright.config.ts  # run tests
```

Docker for snapshot updates (CI is source of truth):

```bash
./scripts/visual-test-docker.sh --update <component>
```

## Adding a Component

```bash
pnpm new:component <name>
```

Each component lives under a category in `04-components/` with:
- `index.scss` - styles (use `--_` prefix for internal tokens)
- `<name>.api.json` - CSS API definition
- `<name>.docs.json` - documentation (use `items` config format, not raw HTML)
- `<name>.visual.spec.ts` - visual regression test

After adding, run `pnpm sync:components` to update the index.

## Changesets

Add a changeset for any user-facing change:

```bash
pnpm changeset
```

Skip for: docs-only, CI/tooling, internal refactors.

When merged to main, the release workflow collects changesets into a "Release" PR. Merging that PR publishes to npm and creates a GitHub release.

## Labels

Auto-applied via `.github/labeler.yml`:
- `pkg: css`, `pkg: docs`
- `type: ci`, `type: docs`
- `component: button`, `component: card`, etc.
