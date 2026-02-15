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
  config/          # Layers + global tokens
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

## Components

**New component**: `pnpm new:component <name>` (prompts for group, or `--group <group>`)

**Layer pattern**:
```scss
@layer primitives {  // layout/
  .sidebar-nav { ... }
}

@layer components {  // components/
  .button { ... }
}
```

**Grid rhythm**: Heights must be multiples of 8px. Visual tests validate with `validateGridRhythm()`.

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
3. **Branch**: `feat/xxx` or `fix/xxx` from main
4. **Implement**: Granular commits as you go
5. **PR**: CI runs lint, typecheck, test, visual-test
6. **Merge**: Squash or merge to main
7. **Close**: Link PR closes issue

**Commit format**: `[CSS] type(scope): message`
Types: `feat` | `fix` | `chore` | `docs` | `refactor` | `test`
