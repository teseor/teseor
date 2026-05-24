# CI gates

Every PR runs the same gates. A PR cannot merge with any gate red.

## The gates

| Job | Tool | Fails when |
| --- | --- | --- |
| **lint** | Biome, Stylelint, markdownlint, `validate-spec.ts`, and the script/CSS checks | Code, CSS, docs, or a spec violates a rule |
| **actionlint** | actionlint | A `.github/workflows/*.yml` file has an error |
| **typecheck** | `tsc --noEmit` | TS errors anywhere |
| **test-unit** | Vitest | Unit/integration tests fail |
| **test-e2e** | Playwright against the harness (`apps/harness`) | Any cross-framework DOM-parity assertion fails, or a snapshot diverges from baseline |
| **build:css** | PostCSS (`pnpm build:css`) | Authored CSS won't compile (e.g. `--t-*` referenced but not declared in `tokens.css`, so the floor plugin can't resolve a literal) |
| **visual** | Playwright + pixelmatch in Docker | Any snapshot differs by >0.1% (gate is wired but trivially passes until `tests/**/__snapshots__/` exists; pixel diff activates at v0.3, see `roadmap.md`) |
| **a11y** | axe-core inside Playwright | Any violation on any example (activates at v0.3 alongside `visual`) |
| **bundle** | size-limit | Bundle exceeds budget |
| **gen-drift** | `pnpm gen && git diff --exit-code` | Generated wrappers, docs, fixtures, or contract tests differ from regen |
| **changeset** | bash diff | `packages/` changed without `.changeset/` |
| **lighthouse** | Lighthouse CI | Docs page scores under target |
| **pr-discipline** | `.github/workflows/pr-discipline.yml` | PR missing `Closes #N`, wrong title format, empty body sections, or labels stale vs `specs/` (see `agent-workflow.md`) |
| **showcase-purity** | `find apps/showcase-*/ -name '*.css'` | `apps/showcase-*/` contains ≠ 1 CSS file (activates from v0.4 when the first showcase lands; before that the gate has no targets and passes trivially) |

## lint

- **Biome** — formatting + lint for TS/JS. Config in `biome.json`.
  - `unit-disallowed-list: ["px"]` with narrow exceptions for borders, shadows, gradients.
  - `declaration-property-value-disallowed-list` — no raw px/rem in `margin`, `padding`, `gap`, `inset`, `block-size`, `inline-size`; `left/right/top/bottom` fully forbidden.
  - `property-disallowed-list: ["float", "clear"]`.
  - `selector-max-specificity: "0,4,2"`, `selector-max-id: 0`, `max-nesting-depth: 3`.
  - `selector-pseudo-class-disallowed-list: [":focus"]` (must use `:focus-visible`).
  - `selector-class-pattern: "^t-[a-z][a-z0-9]*(?:__[a-z][a-z0-9]*)*$"` — block (`.t-button`) and element (`.t-button__icon`) only; no BEM modifier classes (variants are `data-*` attributes).
  - `custom-property-pattern: "^(--_?[a-z][a-z0-9-]*|--t-[a-z][a-z0-9-]*)$"` — covers `--name`, `--_name`, `--t-name`; blocks anything else (`--MyProp`, `--t_button`, …).
  - **Theme files (`themes/*.css`) — token-only rule (planned).** A custom in-house Stylelint rule will block any declaration that isn't a `--t-*` custom property. Allowed selectors: `:root`, `[data-theme="…"]`, `[data-theme="…"][data-mode="…"]`, `@media (prefers-color-scheme: …) { :root, [data-theme="…"] }`. Disallowed: class selectors, element selectors, any `@import`, any `!important`. Not yet wired — themes land at v1.0 and the `themes/` directory does not exist before then. See `architecture/themes.md` § "Hard rule".
- **Motion — `check-motion-scale.ts`** (a `pnpm lint` check, not a Stylelint rule). Fails any component `transition` / `animation` / `transition-duration` / `animation-duration` whose duration is not `calc(… * var(--t-motion-scale))` — see `rules/motion.md` rule 1.
- **Transitionable-property allow-list — `check-transitionable-property.ts`** (a `pnpm lint` check). Fails any component `transition` / `transition-property` whose target is not on `rules/motion.md` rule 4's allow-list, including `all` and the shorthand that omits the property.
- **`validate-spec.ts`** — every `specs/*.yaml` parses against the schema and matches its CSS file's `--t-*` declarations.
- **markdownlint** — `markdownlint-cli2` over `docs/**/*.md` and root `*.md`. Config in `.markdownlint-cli2.jsonc`; line-length (MD013) is off because the docs are not hard-wrapped.

## actionlint

A separate job runs [`actionlint`](https://github.com/rhysd/actionlint) over `.github/workflows/*.yml` — it validates the workflow schema and shellchecks embedded `run:` scripts. It is not part of `pnpm lint` (actionlint is a standalone binary, not an npm package), so it runs only in CI.

## typecheck

`tsc --noEmit` across all packages. `strict: true, noUncheckedIndexedAccess, noImplicitOverride, exactOptionalPropertyTypes`. Internal packages use the strict tsconfig; consumer-facing types in `@teseor/contract` ship looser to let consumers extend props.

## test-unit

Vitest. Co-located: `foo.ts` → `foo.test.ts`. No mocks of `tokens.css` or component files — tests render against the real CSS in jsdom or Playwright.

## test-e2e (cross-framework DOM parity)

Playwright runs `tests/contract/<name>.spec.ts` against the harness app (`apps/harness/`). For every `spec.examples` entry the test:

1. Visits `/react/<name>?fixture=<id>`, captures canonicalized outerHTML of `.t-<name>`.
2. Visits `/vue/<name>?fixture=<id>`, captures canonicalized outerHTML of `.t-<name>`.
3. Asserts the two HTMLs are byte-equal — the cross-framework promise becomes a CI gate.
4. Snapshots the canonical HTML to `tests/contract/<name>.spec.ts-snapshots/<name>-<id>.html`. The snapshot catches drift even when both frameworks regress in the same direction.

Canonicalization sorts attributes alphabetically and strips whitespace-only text nodes (React and Vue handle template whitespace differently). The test file itself is autogenerated by `gen-tests`; see `architecture/codegen-pipeline.md` § "Cross-framework contract tests".

The browser-dependent half (`test-e2e`) runs in CI only — pre-push cannot fire it without a Playwright browser install. The structural half — every fixture id declared in `tests/contract/<name>.spec.ts` has a matching `<!-- id -->` section in the committed snapshot — runs locally as `pnpm lint:contract-snapshots` (`check-contract-snapshots.ts`). It catches the most common drift (adding a fixture without `pnpm test:e2e -u`) without needing a browser; byte-level DOM changes inside an existing fixture stay a CI-only catch.

Behavior tests (clicks, focus, keyboard) and screenshot diffs are separate concerns. Tracked under #582 and the `visual` gate respectively.

## visual

Playwright + pixelmatch. Every component × every wrapper × every theme renders, screenshots, diffs against the committed baseline. Threshold 0.1%.

**Status:** gate is wired (`visual-tests.yml`) but trivially passes until a component lands a committed `__snapshots__/` directory. Pixel diff activates at v0.3 once Stack + Cluster + first atoms give a stable surface to baseline against. DOM-parity (`test-e2e`) is the load-bearing gate until then.

Failure-comment template (no emoji, no "don't worry" softening, no AI references):

```text
Visual tests failed on {{count}} snapshot(s).

[Regenerate baselines]({{workflow_url}}) (one click; force-pushes to this PR.)

Snapshot diffs: [view artifact]({{artifact_url}})
```

**RTL gate.** Every visual test runs twice — once with `dir="ltr"`, once with `dir="rtl"`. The RTL pass is more than a snapshot diff: it asserts logical-property fidelity (e.g. `getComputedStyle(el).paddingInlineStart` equals the LTR value, not zero or the mirrored value). A component that visually mirrors but accidentally swapped `padding-left`/`padding-right` for `padding-inline-start`/`padding-inline-end` fails the RTL pass even when the screenshot looks right.

## a11y

`axe-core` runs inside every Playwright visual test. Zero violations allowed against WCAG 2.2 AA. Component spec's `a11y.keyboard` map gets compiled into keyboard-interaction tests automatically by `gen-tests.ts`.

In addition to axe, every example's accessibility tree gets asserted (`page.getByRole(...)` + name + state) — catches role/name/state regressions axe might miss.

Visual gate runs one extra snapshot per component with `forced-colors: active` emulated (`page.emulateMedia({ forcedColors: 'active' })`). Catches Windows High Contrast regressions where a component disappears or becomes inoperable.

Manual NVDA + VoiceOver smoke test runs per release against the components touched. Checklist generated from the changeset. JAWS deferred post-v1.0. See `rules/accessibility.md` for the full a11y rule set.

**Status:** activates at v0.3 alongside the visual gate. Until then, accessibility is validated by hand against `apps/docs` and the harness-rendered DOM, and via the contract tests' DOM-shape assertions (correct ARIA attrs, role, disabled vs aria-disabled). Behavior-level a11y (focus management, keyboard semantics) is tracked under #582.

## bundle

size-limit, with per-component budgets enforced:

| Artifact | Min | Gz |
| --- | --- | --- |
| Per-component CSS | ≤ 4KB | ≤ 1.5KB |
| `tokens.css` | ≤ 8KB | ≤ 2.5KB |
| `teseor.css` full bundle | ≤ 60KB | ≤ 12KB |
| React / Vue / Svelte / Angular / WebC wrapper per component (with types) | — | ≤ 1KB |

Bundle delta gets posted to the PR as a comment via `size-limit-action`.

**Hard fail on violation.** A budget that doesn't bite isn't a budget. Legitimate growth follows one path: bump the budget in `.size-limit.json` (or `package.json` size-limit field) **in the same PR as the change that causes the growth**. The bump is visible in the diff, requires a one-paragraph justification in the PR body, and becomes the conversation — not a deferred "we'll fix the budget next sprint." Warn-only mode is never enabled; it normalizes drift.

## gen-drift

```bash
pnpm gen
git diff --exit-code
```

The job runs every registered generator and fails if any committed file differs from regen output. Coverage includes wrappers (`packages/*/src/`), fixtures (`apps/harness/src/fixtures/`), contract tests (`tests/contract/`), and the generated docs surface (`apps/docs/src/components/`).

A red drift gate means either (a) the spec changed but someone forgot to commit the regen, or (b) a generated file was hand-edited. Both are bugs.

## build:css

```bash
pnpm build:css                              # PostCSS pipeline → packages/css/dist/
```

The build pipeline runs in this order: `postcss-import` (bundle), `postcss-each` (expand loops), `postcss-custom-media` (resolve breakpoint aliases), `postcss-teseor-floor` (inline literal floors from `tokens.css`). Emits the full `teseor.css`, per-component files (`button.css`, `input.css`, …), and the standalone `tokens.css`, each with an adjacent `.css.map` sourcemap. See ADR-0003.

`build:css` fails if `postcss-teseor-floor` finds a `--t-*` reference in component CSS that isn't declared in `tokens.css` — the build can't resolve a literal, so the component would ship without its third-tier failsafe. The job fails loudly rather than silently emitting two-tier output.

`packages/css/dist/` is `.gitignore`d — only the npm tarball carries compiled CSS. No drift gate is needed because there's no committed dist to drift from; the publish-time build is authoritative.

## changeset

## lighthouse

Runs against 4 representative docs pages on every PR. Scores: performance ≥ 0.8, accessibility ≥ 1.0 (every docs page must be perfect), best practices ≥ 0.9, SEO ≥ 0.9. Config in `lighthouserc.json`.

## Job parallelism

Twelve gates run with maximum parallelism where independent:

| Stage | Jobs (parallel within stage) | Depends on |
| --- | --- | --- |
| 1 | `lint`, `typecheck`, `test`, `changeset`, `pr-discipline`, `showcase-purity` | — |
| 2 | `build:css`, `gen-drift` | `lint` |
| 3 | `visual` + `a11y` (same job, one Playwright run), `bundle` | `build:css` |
| 4 | `lighthouse` | preview deploy |

Wall-clock target: ~5 min on a typical PR (small CSS change, no visual baseline regen).

## Branch protection

All 12 gates are **required** on `main`. No optional checks, no warn-only. Configured via `scripts/repo/protect-main.sh` (a `gh api` script committed to the repo) rather than the GitHub UI — required-checks list lives in version control and survives repo migration.

Emergency override: maintainers can merge with a failing check (auditable in GitHub's audit log). The override path is for genuine emergencies (CI infra down, urgent security patch), not "the visual gate is flaky."

## Workflow files

```text
.github/
├── actions/
│   ├── setup/action.yml              # install node, pnpm, cache
│   └── setup-container/action.yml    # same, container-aware (for Playwright)
├── labeler.yml                       # path-based auto-label config
├── labels.yml                        # label set: names, colors, descriptions
└── workflows/
    ├── ci.yml                # lint, typecheck, test, changeset, build:css, gen-drift, bundle, visual+a11y
    ├── visual-tests.yml      # Playwright in Docker; PR comment on failure (J10 template)
    ├── update-snapshots.yml  # workflow_dispatch; branch input; force-pushes regenerated baselines
    ├── release.yml           # changesets/action; npm publish --provenance — see release.md
    ├── deploy-docs.yml       # Cloudflare Pages; preview per PR; URL posted as comment
    ├── lighthouse.yml        # workflow_run after deploy-docs; against preview URL
    ├── pr-discipline.yml     # linked-issue + title-format + body-sections + labeler — see agent-workflow.md
    ├── sync-labels.yml       # workflow_dispatch + daily cron; syncs labels.yml to repo
    └── stale.yml             # daily; warns at 10d, closes PRs at 14d
```

**Permissions per workflow.** Each workflow declares minimum permissions; `release.yml` needs `id-token: write` for npm provenance + `contents: write` for tags. `update-snapshots.yml` needs `contents: write` to force-push baselines back to the PR branch. `deploy-docs.yml` runs on `pull_request_target` so Cloudflare secrets are available for preview deploys. Everything else is read-only by default.

## Sources

- `process/pr-shape.md` (the PR shape these gates police)
- `process/agent-workflow.md` (the soft-to-hard enforcement stack the GitHub-side gates complete)
- `rules/hard-rules.md` (the rules the `lint` gate enforces)
- `ADR/0003-postcss-build-step.md` (the `build:css` gate)
