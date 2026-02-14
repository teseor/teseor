# UI Lib

CSS-first component library. Components in CSS, framework wrappers later.

## Rules

1. **GitHub Issues first.** Plan -> create issue -> branch -> PR -> merge -> close.
2. **Granular commits.** Format: `[CSS] type(scope): message`. Single-line only.
3. **Tests before commit.** Pre-push runs lint+typecheck; run tests manually.
4. **Be concise.** Sacrifice grammar. Recommend, don't list. Context first.
5. **No dumb comments.** Comments explain WHY, not WHAT.
6. **No emojis. No AI chars.**
7. **Type safe.** No `any` types.
8. **Logical CSS properties.** Use start/end, never left/right.
9. **SCSS comments.** Use `//`, not `/* */`.
10. **CSS prefix.** SCSS: `.button` -> compiled: `.ui-button`.
11. **Test behavior.** Not implementation. Avoid overtesting.
12. **Research with 2025.** Cite sources. Verify recency.
13. **No magic numbers.** Never hardcode values (rem, px, colors) in components, api.json, or docs.json. Always reference design tokens: `var(--ui-size-sm)` not `0.75rem`.
14. **No AI references.** Never mention Claude, AI, or generated-by in commits, issues, PR bodies, or code comments.
15. **Docs JSON: config over HTML.** Use `items` with `tag`/`class`/`children`/`text` objects, never raw `html` strings. Config format enables future translation.
16. **Assign everything.** All issues and PRs must be assigned to the repo owner.
17. **CI gates merge.** Always verify CI passes before merging. Start new features from main, rebased.

## Structure

```
packages/css/src/
  00-config/       # Layers + global tokens
  01-reset/        # Reset styles
  02-base/         # Base HTML styles
  03-layout/       # Layout primitives (stack, grid, sidebar-nav)
  04-components/   # UI components (button, card)
  05-utilities/    # Helper classes
  99-debug/        # Dev tools
```

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

## Components

**New component**: `pnpm new:component <name>`

**Layer pattern**:
```scss
@layer primitives {  // 03-layout
  .sidebar-nav { ... }
}

@layer components {  // 04-components
  .button { ... }
}
```

**Grid rhythm**: Heights must be multiples of 8px. Visual tests validate with `validateGridRhythm()`.

## Docs (Eleventy)

`pnpm --filter docs build` -> multi-page static site at `apps/docs/dist/`

- Nunjucks templating in `apps/docs/src/_includes/`
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
3. **Branch**: `feat/xxx` or `fix/xxx` from main
4. **Implement**: Granular commits as you go
5. **PR**: CI runs lint, typecheck, test, visual-test
6. **Merge**: Squash or merge to main
7. **Close**: Link PR closes issue

**Commit format**: `[CSS] type(scope): message`
Types: `feat` | `fix` | `chore` | `docs` | `refactor` | `test`
