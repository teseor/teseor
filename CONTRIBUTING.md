# Contributing to Teseor

## Development Setup

```bash
# Clone and install
git clone https://github.com/teseor/teseor.git
cd teseor
pnpm install

# Build CSS package
pnpm nx build css

# Run docs locally
pnpm --filter docs dev
```

## Workflow

### 1. Create a branch

```bash
git checkout -b feat/button-loading-state
```

Branch naming:
- `feat/description` - new features
- `fix/description` - bug fixes
- `docs/description` - documentation
- `chore/description` - maintenance

### 2. Make changes

Follow the commit convention:
```
[Package] type: message
```

Examples:
- `[CSS] feat: add button loading state`
- `[Docs] fix: correct grid example`

### 3. Add a changeset (if user-facing)

```bash
pnpm changeset
```

Select affected packages and describe the change. This generates a file in `.changeset/`.

Skip for:
- Documentation-only changes
- Internal refactors
- CI/tooling changes

### 4. Open a PR

- Fill out the PR template
- Ensure CI passes (lint, typecheck, tests)
- Request review

### 5. After merge

The release workflow automatically:
1. Collects changesets
2. Creates a "Version Packages" PR
3. When merged, publishes to npm

## Project Structure

```
packages/
  css/                 # @teseor/css - Core CSS library
    src/
      00-config/       # Tokens, layers
      01-reset/        # CSS reset
      02-base/         # Base typography
      03-layout/       # Layout primitives
      04-components/   # UI components
      05-utilities/    # Utility classes
apps/
  docs/               # Documentation site
```

## Running Tests

```bash
# All tests
pnpm test

# Visual regression
pnpm nx test css

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Adding a Component

1. Create folder: `packages/css/src/04-components/<name>/`
2. Add files:
   - `index.scss` - styles
   - `<name>.api.json` - API definition
   - `<name>.docs.json` - documentation
3. Import in `packages/css/src/index.scss`
4. Add visual test: `<name>.visual.spec.ts`
5. Run `pnpm --filter docs build-docs`

## Labels

Issues and PRs are auto-labeled. Key labels:
- `type: bug`, `type: feature`, `type: docs`
- `pkg: css`, `pkg: react`, `pkg: svelte`
- `status: triage`, `status: ready`, `status: blocked`
