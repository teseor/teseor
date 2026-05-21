# Dev scripts

One naming pattern: `<verb>[:<scope>]`. Bare verb does the whole thing. Scoped form does one slice.

The bare-verb defaults are the verbs you reach for daily: `dev`, `build`, `test`, `lint`, `gen`. Scoped slices exist for inner-loop iteration on one part.

## Script catalog

| Script | What it does | When to use | For who |
| --- | --- | --- | --- |
| `pnpm dev` | Docs site with Eleventy serve + spec/CSS watchers; hot reload | During work | Developer |
| `pnpm build` | Full build: codegen + CSS pipeline + docs site | Before release, rare locally | CI mostly, devs occasionally |
| `pnpm build:css` | CSS pipeline only (PostCSS) | When iterating on tokens or components | Developer |
| `pnpm build:wrappers` | Codegen only (all framework targets) | When iterating on generators | Developer |
| `pnpm build:docs` | Docs site only (Eleventy + Pagefind index) | When iterating on docs UX | Developer |
| `pnpm test` | All tests: unit + visual + a11y | Before commit; in CI | Developer + CI |
| `pnpm test:unit` | Vitest only | Fast inner-loop | Developer |
| `pnpm test:e2e` | Playwright functional suite (`tests/*.spec.ts`) | Before commit when interactions changed; in CI | Developer + CI |
| `pnpm test:visual` | Playwright in Docker (same `PLAYWRIGHT_IMAGE` as CI) | When visuals changed | Developer + CI |
| `pnpm test:a11y` | axe-core via Playwright (subset of visual) | When ARIA / keyboard map changed | Developer |
| `pnpm lint` | Biome + Stylelint + spec validator | Before commit, in CI, via lefthook | Developer + CI + lefthook |
| `pnpm lint:ts` | Biome only | When iterating on TS | Developer |
| `pnpm lint:css` | Stylelint only | When iterating on CSS | Developer |
| `pnpm lint:spec [<name>]` | Spec validator only (same code as CI gate, Levenshtein suggestions) | When iterating on specs | Developer |
| `pnpm gen` | All codegen (wrappers + contract + docs + tests) | After spec changes | Developer + CI |
| `pnpm gen --component=<name>` | Regen one component, all targets | Inner loop on a spec | Developer |
| `pnpm gen --target=<react\|vue\|...>` | One target, all components | Debugging a generator | Developer |
| `pnpm typecheck` | `tsc --noEmit` across all packages | Before commit; in CI; via lefthook | Developer + CI + lefthook |
| `pnpm changeset` | Interactive changesets CLI (writes `.changeset/<slug>.md`) | After implementation | Developer |
| `pnpm release` | Publish to npm with provenance | CI only (errors locally) | CI |

## What we dropped

- **`pnpm new:component <name>`** — standalone component scaffolder. Decayed quickly: once you've made one component, copy-paste from it is just as fast as running a script with a stale embedded template. The same job is done by the `/new-component` slash command (`.claude/commands/new-component.md`), which reads canonical structure from `docs/rules/component-shape.md` + `_vocabulary.yaml` live.
- **`pnpm vibe`** — one-command status snapshot. Reviewed and dropped: the value was only formatted output. The underlying `pnpm lint && pnpm typecheck && pnpm test` chain is fine on its own.

## Where each script lives

`package.json` at the repo root holds the surface above. Individual package `package.json` files use the same verb pattern internally where they have build/test logic — `packages/css/package.json` has `build:css`, `packages/i18n/package.json` has `test`, etc. The root scripts fan out across packages via pnpm's filter syntax (`pnpm -r run build`, `pnpm --filter "@teseor/css" run build`).

## External tooling

| Tool | Used by | Notes |
| --- | --- | --- |
| `postcss` | `pnpm build:css` | Pipeline runner |
| `postcss-import` | build | Bundle `@import` chains |
| `postcss-each` | build | `@each` loops |
| `postcss-custom-media` | build | `@custom-media --md (...)` aliases |
| `postcss-prefix-selector` | consumers (opt-in) | Re-prefix `t-` when vendoring |
| `postcss-teseor-floor` (in-house) | build | Inline literal floors from `tokens.css` (ADR-0003) |
| `stylelint` + PostCSS preprocessor | lint | Reads authored CSS including PostCSS at-rules |
| `biome` | lint | TS/JS formatting + linting |
| `vitest` | test | Unit/integration |
| `playwright` + `pixelmatch` | visual | In Docker for byte-identical snapshots |
| `axe-core` | visual | Inside Playwright tests |
| `size-limit` | bundle | Per-component + bundle budgets |
| `@changesets/cli`, `@changesets/changelog-git`, `changesets/action@v1` | release | Versioning + publishing (fixed-mode) |
| `eleventy` + `nunjucks` | docs | Static docs site, consumed by `gen-docs.ts` |
| `shiki` | docs | Build-time syntax highlighting |
| `pagefind` | docs | Self-hosted search, indexed at build from emitted HTML |
| `lefthook` | git hooks | Parallel pre-commit, commit-msg, pre-push |
| `renovate` | dependency updates | Weekly batched PRs |
| `lit` | webc | Authoring base for generated web-components |
| Lighthouse CI | docs gate | `lighthouserc.json` |
