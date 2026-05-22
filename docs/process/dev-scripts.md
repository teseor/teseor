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

## Renovate policy

Configured in `renovate.json`. The policy keeps Renovate honest without
drowning the queue:

- **Schedule**: weekends only (`* * * * 0,6`). Workweek inboxes stay quiet.
- **Preset**: `config:recommended` (not the deprecated `config:base`).
- **Commits**: `semanticCommits: enabled`, scope `deps`, type `chore` —
  every Renovate PR lands as `chore(deps): <pkg> <old> → <new>`.
- **Labels**: every PR tagged `dep` so triage queries (`is:pr label:dep`)
  pull the whole stream.
- **Automerge**: off. Every dependency PR runs through the same review
  gates as a human PR. Worth the friction; turn this on only after the
  test surface is mature enough to catch regressions reliably.
- **Range strategy**: `bump`. PRs update the `^` range, not lockfile-only,
  so package.json drift stays visible.
- **Throughput limits**: `prHourlyLimit: 4`, `prConcurrentLimit: 10`. Bursts
  capped, queue depth bounded.
- **Lockfile maintenance**: monthly (first of the month). Keeps the
  resolved tree fresh without weekly noise.

### Grouped updates

Three named groups keep semantically-related bumps together:

| Group | Members |
| --- | --- |
| `frameworks` | `react`, `react-dom`, `vue`, `@vue/**`, `svelte`, `@sveltejs/**`, `@angular/**`, matching `@types/react*` |
| `dev tooling` | `@biomejs/**`, `stylelint`, `stylelint-**`, `@playwright/test`, `playwright` |
| `build tooling` | `postcss`, `postcss-**`, `vite`, `@vitejs/**`, `vite-plugin-**` |

A change to any member opens one PR for the group, so a Stylelint bump
that touches `stylelint-config-standard` doesn't queue two PRs that race
each other.

### Out of scope

The Playwright container image (`mcr.microsoft.com/playwright:vX.Y-jammy`
in `.github/workflows/visual-tests.yml` and `ci.yml`) is **not** governed by
Renovate — it's a Docker image, not an npm dep. Bump it manually together
with `@playwright/test` whenever the dev-tooling group fires; the
container tag must match the installed Playwright minor.

## Perf budgets

Two tiers: hard CI gates and soft targets.

### Hard gates

| Surface | Tool | Where the budget lives |
| --- | --- | --- |
| Per-entry CSS bundle | `size-limit` (`@size-limit/file`) | `package.json` → `"size-limit"` array |
| Codegen drift | `pnpm gen && git diff --exit-code` | `.github/workflows/ci.yml` → `gen-drift` |
| Dev-only marker leak | `pnpm verify:no-dev-leak` | `scripts/verify-no-dev-leak.js` |

Current `size-limit` budgets (brotli-compressed, set in root
`package.json`):

| Entry | Budget |
| --- | --- |
| `@teseor/css` (full bundle) | 8 kB |
| `@teseor/css/tokens.css` | 4 kB |
| `@teseor/css/utilities.css` | 2 kB |
| `@teseor/css/tailwind.css` | 6 kB |

Budgets carry ~2–3× headroom over the current floor. Per-component
budgets land alongside the first per-component CSS files emit from the
build (≤4 kB minified / ≤1.5 kB brotli per component, per
`process/ci-gates.md` § "bundle").

### Soft targets

Soft targets aren't CI gates; missing one earns a discussion, not a
failed PR. Tracked via Lighthouse CI (`lighthouserc.json`) against the
docs site:

| Metric | Target | Source |
| --- | --- | --- |
| LCP | < 2.0 s on 3G | Lighthouse `largest-contentful-paint` |
| CLS | < 0.05 | Lighthouse `cumulative-layout-shift` |
| INP | < 200 ms | Lighthouse `interaction-to-next-paint` |
| JS payload (docs site) | < 50 kB gzipped | Lighthouse `total-byte-weight` minus images |
| First component-page load | < 1.5 s on 3G | Lighthouse `speed-index` |

Targets are calibrated against the docs site (the only thing Teseor
itself ships at runtime); consumers' targets depend on their own surface
and aren't enforced here.
