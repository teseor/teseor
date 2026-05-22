# Roadmap

Five phases, numbered fresh. Each phase ships when its CI gates are all green for the listed scope. No date commitments.

> **Milestones ≠ npm versions.** "v0.1 / v0.2 / v0.3" below are *project milestone names* — they label the work in this rewrite. All `@teseor/*` packages publish at one synchronized version (changesets fixed-mode), starting at `3.0.0`; see `process/release.md` § "Packages we publish".

## v0.1 — Foundation

The system has to be real before any component matters.

- `pnpm` monorepo scaffold: `packages/`, `apps/`, `specs/`, `scripts/codegen/`, `tests/`.
- Tooling: Biome, Stylelint, Vitest, Playwright, size-limit, changesets.
- CI: lint, typecheck, test, visual, a11y, bundle, gen-drift, changeset, lighthouse.
- `tokens.css`: full Tier 1 scale + Tier 2 semantic aliases.
- `reset.css`, `base.css`, `@layer` declaration in `teseor.css`.
- `@teseor/css` package publishable.

Done when PR #1 from the first-ten list merges.

## v0.2 — First component end-to-end

Prove the codegen loop.

- `specs/button.yaml`.
- `packages/css/src/components/button/button.css`.
- Generators landed: `gen-contract.ts`, `gen-react.ts`, `gen-vue.ts`, `gen-tests.ts`. Remaining for v0.2: `gen-docs.ts`. Other framework generators (`gen-svelte.ts`, `gen-angular.ts`, `gen-webc.ts`) deferred — the spec-driven shape is proven; adding frameworks is mechanical follow-up. `gen-webc` is the priority follow-up (tracked under #584) since web components are the framework-neutral target — same DOM contract, no runtime, consumable from any stack.
- Two wrapper packages publishable for v0.2: `@teseor/react`, `@teseor/vue`. Post-v0.2: `@teseor/webc` (#584), then `@teseor/svelte` and `@teseor/angular`.
- **Cross-framework contract tests** — `tests/contract/<name>.spec.ts` asserts React and Vue render byte-equal DOM for every `spec.examples` entry, run by Playwright against `apps/harness/`. Pixel-diff visual baselines deferred to a later phase. Matrix expansion tracked under #581, behavior tests under #582.
- Docs page for Button generated from spec.
- **Layout primitive components: Stack + Cluster** (specs + wrappers + docs). Button uses Stack internally for icon+label layout.
- **Code component** (inline + block) — needed for L2 demo blocks on the docs site once a Button page exists.
- **Utilities at v0.2: spacing + display.** Emitted via `postcss-each` from spacing tokens.
- `motion.css` shipped with the keyframes, bundled into `teseor.css`.

Done when PR #2-3 merge. The system is real after this — everything else is repetition.

## v0.3 — Atoms + first headless

Phase 1 components, generated wrappers, generated docs. **Primitives package pulled forward** (was v0.4) so Tooltip + Popover can ship here — the system becomes adoptable for real apps one phase sooner.

- Components: Input, Select, Textarea, Checkbox, Radio, Switch, Badge, Dot, Avatar, Icon, Kbd, Divider, Anchor.
- Layout primitives complete: Center, Sidebar (Stack + Cluster shipped in v0.2).
- All Phase 1 specs at `specs/*.yaml`.
- **`@teseor/primitives` package** ships here (was v0.4): focus-trap, portal, dismissable-layer, anchor positioning. Vanilla functions + per-framework adapters (Radix headless-utility-package model).
- **First overlay components: Tooltip + Popover** — exercise primitives at low stakes before Modal lands in v0.4.
- **Utilities at v0.3: animation (`.t-animate-*`) + text (`.t-truncate`, `.t-line-clamp-*`) + responsive visibility (`.t-hidden-md`, `.t-show-md`).**
- `@teseor/i18n` (in-house ~20-line ICU-like framework, fallback to `en`).
- Two themes: `default` and `editorial`.
- **Figma Variables export:** `dist/figma-variables.json` generated from `tokens.css` by `gen-figma.ts`. Themes map to Figma modes. Designers import via Tokens Studio plugin.
- **Visual baselines for every component × wrapper × theme** (pulled from v0.2 where pixel diff was deferred). Pixelmatch threshold 0.1%. Lands once Stack + Cluster + first atoms give a stable surface to baseline against.
- **`a11y` CI gate** (pulled from v0.2). axe-core inside Playwright runs against every spec example with zero violations against WCAG 2.2 AA. Tied to the visual gate's Playwright run.
- **Behavior tests** (#582). `interactions:` block in specs becomes `tests/behavior/<name>.spec.ts` — clicks, focus, keyboard. Wrapper-agnostic; runs against both `/react/` and `/vue/` harness routes.
- **Combinatorial coverage for contract tests** (#581). `matrix:` block in specs expands to cartesian or pairwise fixtures so DOM-parity catches every variant × intent × size combo, not just hand-picked examples.
- RTL CI gate: every component renders with `dir="rtl"` and visual-tests pass.

Done when PRs #4–#7 land.

## v0.4 — Surfaces + remaining overlays

Composable surfaces, navigation, and the rest of the overlay set. Codegen extends to handle composite components (multiple dependencies declared in `spec.dependencies`).

- Phase 2 components: Card, Alert, Banner, Skeleton, Progress, Tabs, Segmented, Breadcrumb, Pagination, Menu/MenuItem/MenuDivider.
- **Remaining overlays** (pulled forward from v0.5): Modal, Drawer, Toast, Backdrop. With Tooltip + Popover already shipped at v0.3, the overlay set completes here.
- Container-query patterns documented for component-shape-driven adaptation (separate from responsive-prop viewport adaptation).
- First showcase: `apps/showcase-linear/` — Linear-style data-dense + keyboard-driven dashboard. `workspace:*` deps against `@teseor/*`. `"private": true`. **Only Teseor inside** — single `theme.css` (token overrides only), enforced by Stylelint + a CI check that `apps/showcase-*/` contains exactly one CSS file.
- **Benchmark suite ships:** `scripts/benchmark.ts` compares Teseor against Material 3, Polaris, Bootstrap on 6 metrics; `BENCHMARK.md` committed at the repo root, regenerated on release. Nightly cron + per-release-branch; self-regressions block.
- **`@teseor/contract` class-name literal types:** `gen-contract` emits `type TeseorClass = "t-button" | "t-card" | ...` from `_vocabulary.yaml` + spec list. Enables type-safe className usage in consumer code.

Done when PRs #8–#10 land.

## v0.5 — Composite forms, advanced (was v0.6+)

Phase 4 components pulled forward by one phase.

- Phase 4 components: Combobox (+Multi), DatePicker (+Range), Slider, Stepper, Table, Tree, Accordion.
- Documentation: recipes at `docs/recipes/<slug>.md` for common combinations (Modal+Form, Toast+Action, Drawer+Tabs). Each recipe = L2 demo + When-to-use + links to composed components.
- Second and third showcases: `apps/showcase-stripe/` (forms-heavy + trust signals), `apps/showcase-notion/` (composable blocks + sidebar). Same monorepo + only-Teseor rules.

## v0.6+ — Phase 5

- Phase 5: CommandPalette/Spotlight, FileUpload, ColorPicker, ResizableSplit, Carousel, Tour/Coachmark.
- Fourth showcase: `apps/showcase-vercel/` (marketing + dashboard mix).
- **Re-skin gallery** at `teseor.dev/themes` — same showcase rendered with side-by-side themes. Ships once ≥2 themes exist; marketing-grade page proving the theming claim visually.

These are scoped but unscheduled. Phase 5 is largely "we'd be the only known DS shipping these as first-class components" territory — the order depends on real consumer needs once v0.5 is in use.

## v1.0 launch headliners

Three pieces ship together as the v1.0 launch story:

- **Launch theme pack:** in addition to `default` + `editorial`, ship `linear-app`, `stripe-like`, `vercel-like`, `notion-like` — visually distinctive themes that prove the reskinnability claim.
- **Theme lab** at `teseor.dev/lab`: visual editor with color pickers, density slider, live component preview, inline WCAG AA contrast check, export-CSS button. Built with Teseor itself.
- **"Look like X" recipes:** each launch theme paired with a recipe (Linear-app dashboard, Stripe-like payment form, Vercel-style deploy log, Notion-like document page) at `docs/recipes/look-like-<x>.md` + a live demo at `teseor.dev/recipes/look-like-<x>`. Theme + composition + content together.

## Beyond v1.0 (parked, do not commit)

Parked, do-not-commit ideas:

- CLI: `npx teseor init/add/eject`.
- VS Code extension (`@teseor/snippets`).
- `<teseor-stage>` embeddable web component for docs embedding anywhere.
- `@teseor/mcp` MCP server.
- "Diff a theme" CLI.
- Token-aware accessibility (auto-tighten text colors when theme fails WCAG AA).
- AI Component Composer.
- Performance scorecards per docs page.
- Compile-time theme path (pre-resolved CSS, no custom properties).
- Mutation testing on CSS (Stryker-CSS).
- Community theme submission flow.

None of these block v1.0. They show up in `roadmap.md` only so they're not lost.

## What v1.0 means

- All Phase 1–3 components shipped, visually stable across all wrappers and themes.
- Two themes minimum.
- API stability commitment: no major bumps without 90-day deprecation window via `deprecated:` field in specs.
- Docs site at `docs.teseor.dev` (or wherever) deployed via `.github/workflows/deploy-docs.yml`.
- Public RFC process for new components (`docs/RFC/`).

