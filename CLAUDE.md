# UI Lib

CSS-first component library. Components in CSS, framework wrappers later.

## Before You Start

If the task is ambiguous, ask one clarifying question before planning.

Classify every task as **BIG** or **SMALL**:
- **BIG** (3+ files, new feature, architectural change): Plan first, present at most 4 top issues, review interactively
- **SMALL** (1-2 files, bug fix, tweak): Brief summary, one question if ambiguous

For each issue: describe concretely, number issues, letter options (Issue 1, Option A/B/C). Present 2–3 options (including "do nothing"), specify effort/risk/maintenance for each, recommend with reasoning, and wait for approval before proceeding.

## Rules

1. **GitHub Issues first.** Plan -> create issue -> branch -> PR -> merge -> close.
2. **Granular commits.** Format: `[CSS] type(scope): message`. Single-line only.
3. **Tests before commit.** Pre-push runs lint+typecheck; run tests manually.
4. **Be concise.** Sacrifice grammar. Context first.
5. **No dumb comments.** Comments explain WHY, not WHAT.
6. **No emojis. No AI chars.**
7. **Type safe.** No `any`, no `@ts-ignore`, no `as` casting, no `eslint-disable` without approval.
8. **Logical CSS properties.** Use start/end, never left/right.
9. **SCSS comments.** Use `//`, not `/* */`.
10. **CSS prefix.** SCSS: `.button` -> compiled: `.ui-button`.
11. **Test behavior.** Not implementation. Too many tests > too few.
12. **Research with current year.** Cite sources. Verify recency.
13. **No magic numbers.** Never hardcode values (rem, px, colors) in components, api.json, or docs.json. Always reference design tokens: `var(--ui-size-sm)` not `0.75rem`.
14. **No AI references.** Never mention Claude, AI, or generated-by in commits, issues, PR bodies, or code comments.
15. **Docs JSON: config over HTML.** Use `items` with `tag`/`class`/`children`/`text` objects, never raw `html` strings. Config format enables future translation.
16. **Assign everything.** All issues and PRs must be assigned to the repo owner.
17. **CI gates merge.** Always verify CI passes before merging. Start new features from main, rebased.
18. **No globals.** No bare declarations outside `@layer` blocks. No side effects at import time in TS.
19. **Existing patterns first.** Check codebase for prior art before implementing.
20. **One concern per PR.** Don't refactor while implementing. No out-of-scope modifications without asking.
21. **DRY aggressively.** Flag repetition. But don't over-abstract — "engineered enough".
22. **Explicit over clever.** Handle more edge cases, not fewer. Thoughtfulness > speed.
23. **UI decisions need approval.** Never make UI decisions autonomously — reference existing components or ask.

## Architecture

- Propose module boundaries and interfaces before implementing features.
- Never put logic in `utils.ts` — find the right module or create one.
- Each module exposes a minimal public interface; internals stay private.

## Structure

```
packages/css/
  src/
    config/          # Layers (layers.scss) + global tokens (tokens/) + guides (guides/)
    reset/           # Reset styles
    base/            # Base HTML styles
    layout/          # Layout primitives (column, row, grid, box, center, container, app-shell, ...)
    components/      # UI components grouped: [group]/[name]/
      actions/         # button, button-group, close-button
      typography/      # heading, link, code, code-block, kbd, blockquote, list, mark
      forms/           # input, select, checkbox, radio, toggle, slider, fieldset, ...
      data-display/    # avatar, badge, card, table, tag, stat, ...
      feedback/        # alert, spinner, progress, progress-circle, skeleton, toast
      overlays/        # modal, dialog, drawer, tooltip, popover, overlay
      disclosure/      # accordion, disclosure
      navigation/      # tabs, breadcrumb, menu, dropdown-menu, nav, pagination
      content/         # divider, spacer, scroll-area
    utilities/       # Helper classes
    debug/           # Dev tools
  test-utils/        # Shared test helpers (scaffold, visual regression, grid alignment)
```

**Auto-discovery**: Components are discovered from directory structure. No manual registration needed — just create files in the right group folder.

**Colocated files** per component/primitive:
- `index.scss` - Styles with internal tokens (`--_` prefix)
- `<name>.api.json` - CSS API definition
- `<name>.docs.json` - Documentation
- `<name>.visual.spec.ts` - Visual regression test

## Naming

**Tokens**: `--ui-[category]-[scale]`
| Category | Example |
|----------|---------|
| Space | `--ui-space-2` (16px) |
| Row | `--ui-row-2` (32px) |
| Color | `--ui-color-primary` |
| Component | `--ui-button-height` |
| Internal | `--_bg` (component-scoped) |

**Classes (BEM)**: `.ui-[block]--[modifier]` / `.ui-[block]__[element]`

## Conventions

**Token fallback pattern** (3-tier):
```scss
property: var(--ui-component-token, var(--ui-global-token, #{$fallback}));
```

**Token imports**:
```scss
// base/ and layout/
@use '../config/tokens/variables' as t;   // or ../../config/... for deeper nesting

// components/ (always 3 levels deep)
@use '../../../config/tokens/variables' as t;
```

**Internal variables**: Prefix with `--_` for component-scoped vars (not part of public API).

## Components

**Layer pattern**:
```scss
// layout/ — single layer
@layer primitives {
  .sidebar-nav { ... }
}

// components/ — split tokens from styles
@layer components.tokens {
  .button { --_height: var(--ui-button-height, var(--ui-row-2, #{t.$row-2})); }
}
@layer components.styles {
  .button { height: var(--_height); }
}
```

**Grid rhythm**: Heights must be multiples of 8px. Visual tests validate with `validateGridRhythm()`.

## Testing

- Integration tests for cross-module interactions, not just unit tests.
- New modules require at least one integration test before considered done.
- Never delete or weaken existing tests.
- Visual snapshots must be updated via Docker to match CI: `./scripts/visual-test-docker.sh --update`

**Local commands**:
```bash
pnpm lint                # biome + stylelint + lint-components + validate-docs
pnpm typecheck           # tsc --noEmit
pnpm test:unit           # vitest
pnpm test:visual         # playwright visual regression (Docker)
pnpm test:visual:update  # update visual snapshots (Docker)
```

## Docs (Eleventy)

`pnpm --filter docs-css build` -> multi-page static site at `apps/docs-css/dist/`

- Nunjucks templating in `apps/docs-css/src/_includes/`
- Pages generated from `*.docs.json` files
- Sidenav auto-generated from doc types

**Nunjucks in docs JSON**:
```json
{
  "data": { "sizes": ["sm", "md", "lg"] },
  "code": "{% for s in sizes %}<button class=\"ui-button--{{ s }}\">{% endfor %}"
}
```

## Workflow (Trunk-Based)

```
Plan -> Approve -> Create GitHub Issue -> Branch -> Implement -> PR -> CI -> Merge -> Close Issue
```

1. **Plan**: Discuss approach before coding
2. **Issue**: Create GitHub issue with clear scope
3. **Branch**: `feat/xxx`, `fix/xxx`, `chore/xxx`, `docs/xxx`, `refactor/xxx`, or `test/xxx` from main
4. **Implement**: Granular commits as you go
5. **PR**: CI runs lint, typecheck, test, visual-test
6. **Merge**: Squash or merge to main
7. **Close**: Link PR closes issue

**Commit format**: `[CSS] type(scope): message`
Types: `feat` | `fix` | `chore` | `docs` | `refactor` | `test`

**Changesets**: Every PR that changes `packages/css/` must include a changeset. Package name: `@teseor/css`.
```bash
pnpm changeset  # interactive prompt
```

**Guardrails**:
- 3+ files touched → write a brief plan first and wait for approval.
- 5+ files touched → stop and break the task down first.

## Definition of Done

- Implementation matches the approved plan.
- All tests pass.
- Nothing outside the agreed scope was modified.
- Summarize what changed and what was intentionally left out.

## Parallel Work

**Git worktrees for parallel agents.** When multiple agents need separate branches, always use git worktrees to avoid filesystem conflicts:
```bash
git worktree add /tmp/ui-lib-<branch-suffix> -b <branch-name> main
# Agent works in /tmp/ui-lib-<branch-suffix>
# Clean up after merge:
git worktree remove /tmp/ui-lib-<branch-suffix>
```
Never run parallel agents on different branches in the same working directory — file writes and git operations will conflict.
