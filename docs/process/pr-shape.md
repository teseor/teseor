# PR shape

Every PR follows the same shape. The shape exists so CI gates can do their job; bigger PRs slip bugs past them.

## The rules

- **Closes 1–3 issues.** A PR that closes nothing is a refactor PR and still needs an issue. A PR that closes 4+ issues is probably two PRs.
- **≤500 LOC of handwritten code.** Generated files (everything under `packages/react/src/`, `packages/vue/src/`, `packages/svelte/src/`, `packages/angular/src/`, `packages/webc/src/`, `packages/contract/src/`, `apps/docs/src/components/`, `tests/<name>/`) don't count.
- **Has a changeset entry.** `pnpm changeset` writes a `.changeset/<slug>.md`. If `packages/` changed and `.changeset/` didn't, CI fails (diff-based bash check).
- **Conventional-commit title.** `type(scope): subject` — see prefixes below.
- **Passes CI.** Lint, typecheck, test, visual-regression, bundle-budget, gen-drift, changeset gate.
- **Squash-merged.** One commit per PR on `main`. Branch is deleted on merge.
- **One concern per PR.** Don't refactor while implementing the feature. Don't bundle out-of-scope cleanup.

## Commit prefixes

| Prefix | Use for |
| --- | --- |
| `feat(button)`, `feat(modal)` | new component, new variant on an existing component |
| `feat(token)` | new token in `tokens.css` |
| `feat(theme)` | new theme file |
| `feat(codegen)` | new generator or generator capability |
| `feat(showcase)` | new showcase page (no changeset — showcases don't publish) |
| `fix(button)` | bug fix in a specific component |
| `perf(css)` | measurable bundle or runtime improvement |
| `docs:` | docs-only change |
| `chore:` | tooling, configs, scripts |
| `test:` | tests-only change |

No `[CSS]` namespace prefix.

## What "≤500 LOC" excludes

Generated files. Changesets. Lockfiles. Snapshot PNGs. `.gitkeep`. The cap exists to bound *handwritten* surface area, not codegen output. A spec-migration PR may touch 2000 lines of generated wrappers — that's fine.

## The first ten PRs (the spine of v0.1–v0.2)

This is the order of the first PRs. Each one is a worked example of the rules above.

| # | Title | Approx. handwritten LOC |
| --- | --- | --- |
| 1 | `chore(repo): monorepo scaffold + workflow discipline` | ~500 (pnpm + Vite + Biome + Stylelint + TS strict + **lefthook commit-msg hook** + **`.github/workflows/pr-discipline.yml`** + **`.github/labeler.yml`** + **project `CLAUDE.md`** + **`.claude/commands/{work-on,done,ship,issue-this}.md`**). No components, no codegen yet. PR #1 includes the full workflow-discipline layer (see `process/agent-workflow.md`) so every subsequent PR is gated from day one. |
| 2 | `feat(button): spec + react wrapper + visual baseline` | ~250 handwritten + generated wrapper. First spec, first codegen, first visual baseline. |
| 3 | `feat(codegen): vue, svelte, angular, webc wrappers` | ~400 handwritten generators. Same Button, four more wrappers. |
| 4 | `chore(specs): migrate phase 1 components` | ~80 LOC code + bulk YAML. Pure data migration. No new CSS. |
| 5 | `feat(codegen): generate all phase 1 wrappers` | ~50 handwritten (orchestration). Wrappers all generated. |
| 6 | `feat(docs): generate docs from specs` | ~450 (eleventy + gen-docs + button page parity). Replaces handwritten button doc with generated equivalent. |
| 7 | `feat(i18n): in-house ICU-like message framework` | ~400. ~20-line message framework + tests. |
| 8 | `feat(components): phase 2 surfaces (Card, Alert, Banner, Skeleton, Progress)` | ~500 across five components. |
| 9 | `feat(components): phase 2 surfaces (Tabs, Segmented, Breadcrumb, Pagination, Menu)` | ~500. |
| 10 | `feat(showcase): linear-style dashboard` | ~500. No changeset — showcase. |

## PR body template

```
## What
One sentence.

## Why
The why, not the what. Link the closing issue (Closes #N).

## Test plan
- [ ] Specific things a reviewer should verify locally
- [ ] Any visual regression notes (baseline added? updated?)
- [ ] Any bundle-size delta worth flagging

## Out of scope
Anything intentionally left for a follow-up issue.
```

No emojis. No "Generated with Claude / AI" references.
