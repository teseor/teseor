# Compatibility & support matrix

Modern-only. Teseor targets Baseline 2024 — features that are "Widely available" per MDN's interop signal. Consumers needing older-browser support compile Teseor themselves with their own toolchain; we don't ship for that path.

## Browsers (consumer-facing)

| Browser | Minimum |
| --- | --- |
| Chrome | ≥ 111 (March 2023) |
| Edge | ≥ 111 |
| Firefox | ≥ 113 (May 2023) |
| Safari | ≥ 15.4 (March 2022) |
| iOS Safari | ≥ 15.4 |
| Chrome Android | last 2 stable (rolling) |

Documented in `.browserslistrc` at the repo root. CI gates and Autoprefixer (consumer-side, optional) read this file.

## CSS feature baseline

| Feature | Baseline year | Notes |
| --- | --- | --- |
| `@layer` | 2022 | Cascade ordering — load-bearing for Teseor |
| Logical properties (`block-size`, `padding-inline`, …) | 2023 | RTL fidelity (`rules/hard-rules.md` rule 5) |
| `:has()` | 2023 | Used sparingly; never load-bearing for an essential feature |
| `oklch()` color space | 2024 | Token color space (`architecture/three-tier-tokens.md` § "Colors") |
| `@container` | 2024 | Container queries for shape adaptation (`rules/responsive.md` § "Container queries") |
| `@custom-media` | resolved at build | `postcss-custom-media` inlines; consumer never sees the at-rule |

We do not use features outside Baseline 2024 in shipped CSS. Anything cutting-edge is a build-time concern that resolves to baseline-supported output.

## Polyfill strategy

**None.** We ship zero polyfills. The `dist/` output uses Baseline 2024 features and assumes they're available.

Consumers with broader browser-support needs:
- Run Autoprefixer over Teseor's `dist/` output to back-port vendor prefixes.
- Compile Teseor's source CSS themselves with a different PostCSS preset.
- Pin a Teseor version that matches their support window and stop upgrading.

We don't enable any of those paths in our own publish; they're consumer concerns.

## Toolchain (build-time)

| Tool | Minimum |
| --- | --- |
| Node.js | 24 LTS (Krypton) — `.nvmrc` and `.node-version` pin to `24` |
| pnpm | 11.1.3 — `packageManager` field enforces via Corepack |

## Consumer code (TypeScript)

| Tool | Minimum |
| --- | --- |
| TypeScript | ≥ 6.0 for consumers of `@teseor/contract` |

TS 6.0 is the floor for `NoInfer`, `const` type parameters with stable inference, the `satisfies` operator, and `verbatimModuleSyntax` semantics that `@teseor/contract` relies on. Older TS users will hit type errors that can't be silenced — that's the right cost boundary, not a graceful degradation we have to engineer.

## Framework wrappers

Each wrapper package declares its own peerDependency floor. The mins reflect "current but not bleeding edge" as of mid-2026.

| Wrapper | Minimum | Why |
| --- | --- | --- |
| `@teseor/react` | React ≥ 19 | Server Actions stable, RSC stable, `useActionState`, `useFormStatus`, improved Suspense |
| `@teseor/vue` | Vue ≥ 3.5 | `defineModel` macro stable, `useTemplateRef`, computed cleanup |
| `@teseor/svelte` | Svelte ≥ 5 | Runes + snippets stable; Svelte 4 reached EOL |
| `@teseor/angular` | Angular ≥ 19 | `@if` / `@for` control flow, signals stable, standalone-component default, zoneless preview |
| `@teseor/webc` | Modern browsers (no framework dep) | Built on Lit 3 |

A consumer on an older framework version installs an older Teseor wrapper version — not the latest. The roadmap (roadmap.md) doesn't backport features to old wrapper versions.

## Why "modern-only" is the right floor

The Baseline-2024 stance commits Teseor to a small CSS surface and zero polyfill weight. Three benefits:

1. **Bundle stays small.** No polyfill bytes; no autoprefixer noise in `dist/`. The per-component budget (≤ 4KB per component; see `process/ci-gates.md` § "bundle") is achievable because we're not paying compatibility tax.
2. **CSS authoring stays clean.** `oklch()`, `@layer`, `@container` are written directly. No `var()` fallback chains for pre-modern browsers; no `-webkit-` prefixes in source.
3. **Consumers self-select.** Teams targeting 2018-era browsers (IE 11, old Safari) know up-front Teseor isn't for them. We don't promise something we can't deliver well.

The cost is real: we exclude consumers on older platforms. The benefit is that what we ship works well, predictably, with no compatibility surprises.

## React Server Components

`@teseor/react` is RSC-safe by default. Atomic components have no state and no event handlers in their generated form — handlers are passed by the consumer as props — so they're pure prop-to-markup transformations that render fine on the server. The generated wrapper file has no `"use client"` directive.

Stateful components (Combobox, Tabs, Accordion, Menu, Modal — anything where `spec.behavior !== "none"`) need client-side runtime. `gen-react` adds `"use client"` at the top of those wrapper files automatically when the spec declares behavior. Consumers can import them in any RSC framework (Next.js, Remix v3, Waku, …); the directive routes them to the client boundary as expected.

The atomic/primitive/stateful split (per `architecture/codegen-pipeline.md` § "Behavior tiers") drives the directive emission. No manual `"use client"` is ever added; it follows the spec.

## SSR & framework adapters

No Teseor-specific SSR adapter packages. The wrappers' default ESM output + RSC-safe directives + cookie-resolved theme make Teseor work cleanly in every modern SSR/RSC framework.

| Framework | Status | Notes |
| --- | --- | --- |
| Next.js (App Router) | Supported | `"use client"` handled by codegen; RSC boundaries respected |
| Next.js (Pages Router) | Supported | Standard React 19 wrapper works |
| Remix v3 | Supported | RSC-compatible |
| Nuxt 3 | Supported | `@teseor/vue` runs in Nuxt's universal mode |
| SvelteKit | Supported | `@teseor/svelte` (Svelte 5) runs in SvelteKit |
| Angular Universal | Supported | `@teseor/angular` is SSR-compatible |
| Astro | Supported | Use Teseor wrappers as Astro islands, or `@teseor/css` directly in `.astro` files |

**Critical CSS extraction:** deferred to the consumer's framework. Next.js, Astro, Remix all run their own critical-CSS pipelines; Teseor doesn't ship an extractor.

**Theme on first render (no flash):** the theme switcher writes cookies (`teseor_theme`, `teseor_mode`); the server reads them and renders `<html data-theme="..." data-mode="...">` in the initial response. Hydration matches. A recipe at `docs/recipes/ssr-theme-resolution.md` (ships v0.5) carries framework-specific snippets (Next.js cookies API, Remix loader, SvelteKit hooks, Nuxt server middleware).

**Streaming SSR / Suspense:** compatible by construction. Atomic components are pure markup — they don't suspend, don't fetch. Stateful components (overlays, surfaces post-v0.3) suspend on the *client* side because they're emitted as `"use client"`; the server-rendered markup is final.

## ESM only

`@teseor/react`, `@teseor/vue`, `@teseor/svelte`, `@teseor/angular`, `@teseor/webc`, `@teseor/css`, `@teseor/i18n`, `@teseor/contract` all ship ESM only. `package.json` has `"type": "module"` and `exports` maps without `"require"` keys.

Reasons: Node 22 defaults to ESM; modern bundlers (Vite, esbuild, Rollup, Webpack 5, Turbopack) handle ESM cleanly; dual ESM/CJS packages risk duplicate instances at runtime when consumer code mixes `require` and `import`. The cost we avoid (CJS users updating their tooling) is smaller than the cost we'd take on (dual-package complexity, doubled publish surface).

## Updating the matrix

Browser/CSS baseline tightens roughly every 12 months as new features mature. We re-evaluate at major bumps (0.x → 0.y where bumps cross the `oklch()` / `@container` / etc. line). Tightening is a minor bump if it doesn't break existing consumer code; loosening (relaxing baselines) is rare.

Framework minimums tighten when an upstream framework hits EOL or when its features become reliably available. Tightening a framework minimum is a major bump for the affected wrapper package.

## Sources

- Baseline 2024 — MDN interop signal
- `.browserslistrc` at repo root (lands PR #1)
