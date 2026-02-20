# Documentation Infrastructure Comparison (2026)

Technical research across 14 major design system documentation sites. Covers tech stack, content authoring, i18n, playground systems, API docs generation, CI pipelines, search, versioning, and whether each library dogfoods its own DS.

Companion to [docs-benchmark-2026.md](./docs-benchmark-2026.md) which covers content quality and UX patterns.

---

## Tech Stack & Hosting

| Library | Framework | Content Format | Hosting | Uses Own DS |
|---------|-----------|---------------|---------|:-----------:|
| **Adobe Spectrum** | Next.js (guidelines) + Custom Parcel SSG (React Spectrum) + Storybook (CSS) | MDX | Adobe CDN / S3 / GH Pages | Yes |
| **Material Design 3** | Proprietary (m3.material.io) / 11ty + Lit (material-web.dev) | Internal / Markdown + Nunjucks | Google infra / Firebase | Yes |
| **Ant Design** | dumi 2.x + Mako bundler (Rust) | Markdown + custom `<code>` tags | GH Pages + Surge.sh | Yes |
| **Primer (GitHub)** | Gatsby 3 (migrating to Next.js 16 + Nextra) | MDX | GitHub Pages | Yes |
| **Tailwind CSS** | Next.js 16 (App Router) + Turbopack | MDX | Vercel | Yes |
| **shadcn/ui** | Next.js 16 (App Router) + Fumadocs | MDX | Vercel | Yes |
| **Radix UI** | Next.js 14 (Pages Router) + mdx-bundler | MDX | Vercel | Yes |
| **Chakra UI** | Next.js 15 (App Router) + Velite | MDX | Vercel | Yes |
| **MUI** | Next.js 15 + markdown-to-jsx (custom loader) | Custom Markdown | Netlify | Yes |
| **HeroUI (NextUI)** | Next.js 15 + Contentlayer2 | MDX | Vercel | Yes |
| **Mantine** | Next.js 15 + @next/mdx | MDX | GitHub Pages | Yes |
| **GOV.UK** | Metalsmith + Nunjucks | Markdown + YAML frontmatter | Netlify | Yes |
| **Shopify Polaris** | Next.js 15 (now deprecated) | MDX | Vercel | Yes |
| **IBM Carbon** | Gatsby 5 + gatsby-theme-carbon | MDX | Vercel | Yes |

**Finding: every library dogfoods its own DS on its docs site.** The docs site is the ultimate dogfooding environment.

**Framework breakdown:**
- Next.js: 11 of 14 (dominant)
- Gatsby: 2 (Carbon, Primer -- both aging/migrating)
- Other: Metalsmith (GOV.UK), dumi (Ant Design), 11ty (Material Web), custom Parcel (Adobe)

---

## i18n, Search & Versioning

| Library | i18n (Docs) | Search | Versioning |
|---------|-------------|--------|------------|
| **Adobe Spectrum** | English only | Algolia DocSearch | Archive at `/v3/` |
| **Material Design 3** | English only | None | None |
| **Ant Design** | **zh-CN + en-US** (dual files per component) | dumi built-in (client-side) | Subdomains (`5x.ant.design`, `4x.ant.design`) |
| **Primer (GitHub)** | English only | Fuse.js in Web Worker | Per-status pages (alpha/beta/stable) |
| **Tailwind CSS** | English only | Algolia DocSearch | Subdomains (`v3.tailwindcss.com`, `v2.tailwindcss.com`) |
| **shadcn/ui** | English only | Orama (self-hosted, via Fumadocs) | Legacy docs page (v3/v4) |
| **Radix UI** | English only | Algolia + autocomplete | Single version only |
| **Chakra UI** | English only (v2 attempt abandoned) | Fuse.js + match-sorter | Subdomains (`v2.chakra-ui.com`, `v1.chakra-ui.com`) |
| **MUI** | Infra exists (Crowdin), English-only in practice | Algolia + flexsearch (dual) | Subdomains (`v4.mui.com`, `v5.mui.com`) |
| **HeroUI (NextUI)** | English only | Algolia + cmdk (Cmd+K palette) | Subdomain for beta (`v3.heroui.com`) |
| **Mantine** | English only | Own Spotlight component (dogfooding) | Subdomains (`v5.mantine.dev`, `v6.mantine.dev`) |
| **GOV.UK** | English only (component-level Welsh) | Lunr.js + accessible-autocomplete | Single version only |
| **Shopify Polaris** | English only | Fuse.js | Migration guides per major version |
| **IBM Carbon** | English only | Lunr.js (react-lunr) | Subdomains (`v10.carbondesignsystem.com`) |

**i18n finding:** only Ant Design has real bilingual docs. MUI tried via Crowdin and scaled back. Translation is high-effort, low-return for component libraries.

**Search breakdown:**
- Algolia DocSearch: 5 (Adobe, Tailwind, Radix, MUI, HeroUI)
- Client-side (Fuse.js/Lunr.js/Orama): 6 (Primer, Chakra, Polaris, GOV.UK, Carbon, shadcn)
- Own component: 1 (Mantine -- Spotlight)
- None: 1 (Material Design)

---

## Playground & API Docs Generation

| Library | Playground System | API Docs Generation | Notable CI |
|---------|-------------------|--------------------|----|
| **Adobe Spectrum** | Live MDX examples + Storybook (CSS) | **Fully auto** -- custom Parcel plugins parse TS source, extract interfaces/props/events | CircleCI, `ts-diff` API breaking-change detection on PRs |
| **Material Design 3** | playground-elements (in-browser, serverless) | **Fully auto** -- custom `@lit-labs/analyzer`, writes Markdown tables between markers | 10 GH Actions, auto-PR on API changes, Firebase PR previews |
| **Ant Design** | Inline live demos + Sandpack + CodeSandbox/CodePen/StackBlitz export | **Manual** props tables; **auto** token docs (TypeDoc + ReactDOMServer) | 34 GH Actions, Puppeteer VRT, `pkg.pr.new` |
| **Primer (GitHub)** | react-live (editable code) | **Semi-auto** -- `@primer/doc-gen` reads `.docs.json` + derives from TS types | Storybook tests, automated Figma image pipeline |
| **Tailwind CSS** | Resizable examples (Framer Motion) + Tailwind Play (separate app) | **Manual** (ApiTable rows prop) | None -- Vercel auto-deploys only |
| **shadcn/ui** | Pre-rendered registry components | **Manual** (MDX) | 7 GH Actions, registry validation |
| **Radix UI** | Themes playground + static demos | **Manual** (PropsTable data arrays in MDX) | Minimal (Husky pre-commit) |
| **Chakra UI** | StackBlitz integration (every example) | **Semi-auto** -- ts-morph scripts extract types at build time | 3 GH Actions |
| **MUI** | react-runner (live editing in browser) | **Fully auto** -- `@mui-internal/api-docs-builder` (TS AST + react-docgen + doctrine) | GH Actions, bundle analysis |
| **HeroUI (NextUI)** | Sandpack + react-live + StackBlitz | **Manual** (APITable in MDX) | GH Actions, changesets |
| **Mantine** | Configurator widgets (prop togglers, no code editor) | **Semi-auto** -- `react-docgen-typescript` via `mantine-docgen-script` | GH Actions |
| **GOV.UK** | Iframe previews (HTML + Nunjucks tabs) | **Manual** | GH Actions + Netlify |
| **Shopify Polaris** | Playroom (seek-oss) -- multi-viewport JSX sandbox | **Fully auto** -- custom `get-props` script extracts TS types | 15 GH Actions, a11y + VRT |
| **IBM Carbon** | Storybook (separate deployment) + CodeSandbox | **Auto** (Storybook `react-docgen-typescript`) on Storybook; **manual** on main site | 9 GH Actions, image optimization pipeline |

**API docs generation breakdown:**
- Fully automated: 4 (Adobe, Material Web, MUI, Polaris)
- Semi-automated: 4 (Primer, Chakra, Mantine, Carbon via Storybook)
- Manual: 6 (Ant Design props, Tailwind, shadcn, Radix, HeroUI, GOV.UK)

---

## Quality Rating

| Library | Score | Rationale |
|---------|:-----:|-----------|
| **Adobe Spectrum** | 9.5/10 | Most sophisticated: custom TS API extraction, MCP servers for AI, PR previews, multi-site architecture |
| **Ant Design** | 9.0/10 | Bilingual, 34 CI workflows, pkg.pr.new, Sandpack, LLMs.txt, semantic DOM visualization |
| **Tailwind CSS** | 9.0/10 | Beautiful, polished, Algolia, custom Shiki grammars, OG image generation. Simple but premium |
| **MUI** | 8.5/10 | Fully auto API docs, live editor, Algolia + flexsearch dual search, PWA/offline support |
| **Shopify Polaris** | 8.5/10 | Was best-in-class: Playroom, auto props, VS Code extension, migrator CLI. Now deprecated |
| **Primer (GitHub)** | 8.0/10 | Multi-implementation pages (React/Rails/Figma/CSS), @primer/doc-gen, Figma image pipeline |
| **Mantine** | 8.0/10 | Clean DX, great dogfooding (search = own Spotlight), LLMs.txt, help center |
| **shadcn/ui** | 8.0/10 | llms.txt for AI, Orama search, registry system, Fumadocs. Modern and lean |
| **IBM Carbon** | 7.5/10 | Reusable gatsby-theme-carbon, Storybook for API. Gatsby aging but solid |
| **Chakra UI** | 7.5/10 | StackBlitz integration, ts-morph extraction, Velite. v3 rewrite improved DX |
| **GOV.UK** | 7.5/10 | Exemplary content quality and structure. Deliberately simple tech. Accessibility gold standard |
| **Material Design 3** | 7.0/10 | Main site proprietary/closed. Open catalog uses playground-elements but no search, no versioning |
| **Radix UI** | 7.0/10 | Algolia search, Themes playground. Manual API docs, single version, minimal CI |
| **HeroUI (NextUI)** | 6.5/10 | Manual everything, standard Next.js. Functional but unremarkable |

---

## Patterns Worth Adopting

| Pattern | Used By | Relevance to Our Project |
|---------|---------|--------------------------|
| **llms.txt / AI-optimized content** | shadcn/ui, Ant Design, Mantine, Adobe (MCP servers) | High -- forward-looking, low effort |
| **Auto API docs from source types** | Adobe, Material Web, MUI, Polaris | High -- our `api.json` is already structured for this |
| **PR preview deploys** | Nearly everyone (Vercel/Netlify/Firebase/Surge) | High -- should set up for docs-astro |
| **Subdomain per major version** | Tailwind, Ant Design, Chakra, Carbon, MUI, Mantine | Medium -- when we ship breaking changes |
| **Client-side search (Pagefind)** | Alternative to Algolia/Fuse.js/Lunr.js | Medium -- already tracked in issue #418 |
| **Resizable preview containers** | Tailwind (Framer Motion drag handles) | Lower -- nice polish for responsive demos |
| **Reusable docs theme** | Carbon (gatsby-theme-carbon) | Lower -- single-site for now |

---

## Per-Library Deep Dives

### Adobe Spectrum

Adobe maintains multiple Spectrum documentation sites with different tech stacks:

- **spectrum.adobe.com** -- Next.js with RSC, Adobe CDN
- **react-spectrum.adobe.com** -- Custom Parcel-based SSG with MDX, S3 hosting, Azure Blob PR previews
- **opensource.adobe.com/spectrum-css** -- Storybook, GitHub Pages
- **opensource.adobe.com/spectrum-web-components** -- 11ty + Storybook, GitHub Pages

Content is MDX colocated with packages. Code block metadata tags (`example`, `snippet`, `hidden`, `flip`, `themeSwitcher`) control rendering behavior.

API extraction uses custom Parcel plugins (`parcel-transformer-docs`, `parcel-packager-docs`) that parse TS source, resolve type references, merge re-exports, and output structured JSON. A `ts-diff` CI job compares APIs between PR branches and published npm packages.

Notable: MCP servers (`@adobe/spectrum-design-data-mcp`) expose design tokens and component schemas to AI assistants.

### Material Design 3

- **m3.material.io** -- proprietary, uses internal `mio-*` web components, not open-source
- **material-web.dev** -- 11ty + Lit + esbuild, uses `playground-elements` for in-browser coding (Service Worker + TS compiler in Web Worker)

API docs auto-generated via `@lit-labs/analyzer`. A GitHub Actions workflow (`update-docs-on-main.yml`) regenerates API tables between `<!-- auto-generated API docs start/end -->` markers and creates PRs automatically.

Custom stories system (not Storybook) with typed knobs. No search on either site.

### Ant Design

Uses **dumi 2.x** (purpose-built for component library docs) with **Mako** (Rust bundler) and SSR in production.

Bilingual content: separate `index.en-US.md` / `index.zh-CN.md` per component. Demo descriptions are bilingual in a single `.md` file using `## zh-CN` / `## en-US` section headers.

Multi-layered playground: inline live demos (dumi `useLiveDemo`), Sandpack embed, CodeSandbox/CodePen/StackBlitz export buttons.

API prop tables are hand-written. Token docs are auto-generated via TypeDoc + `ReactDOMServer.renderToString()`. A custom LLMs plugin generates structured markdown for AI consumption.

34 GitHub Actions workflows. Uses Blacksmith CI runners (4 vCPU). `pkg.pr.new` publishes installable npm packages for every PR.

### Primer (GitHub)

Multi-repo system migrating from Gatsby to Next.js 16 + Nextra:

- **primer/design** -- Gatsby 3 + `@primer/gatsby-theme-doctocat`, React 17, styled-components
- **primer/react** -- Storybook 8 + Vite
- **primer/doctocat-nextjs** -- Next.js 16, React 19, CSS Modules, react-live v4 (in progress)

Content is MDX. YAML frontmatter links components across implementations (`reactId`, `railsIds`, `figmaId`, `cssId`). A single MDX page generates sub-pages for React, Rails, Figma, and CSS implementations.

`@primer/doc-gen` reads `.docs.json` files with optional `derive: true` to extract from TS types. `components.json` aggregates data from npm (React), RubyGems (Rails), GitHub (Figma), and internal artifacts.

Automated Figma image pipeline: scans MDX for Figma node URLs, downloads via API, auto-commits.

### Tailwind CSS

Next.js 16 with Turbopack. 194 flat MDX files, one per utility. Manual sidebar navigation in TypeScript.

Resizable example containers using Framer Motion drag handles. `generated-css.tsx` compiles Tailwind CSS at build time to show actual CSS output.

Custom Shiki setup with TextMate grammar injections for Tailwind-specific syntax (`@apply`, `@theme`, `theme()`). Supports 20+ languages including Astro, Blade, Twig.

Remarkably minimal CI -- no GitHub Actions workflows. Vercel handles everything. No test files in the repository (docs site is proprietary, not open-source).

### shadcn/ui

Next.js 16 + Fumadocs (all-in-one docs framework). Registry system is central: `build-registry.mts` generates public JSON and lazy React imports per component.

`llms.txt` and `/llm/` API route serve AI-optimized markdown. `processMdxForLLMs()` replaces `<ComponentPreview>` with actual source code so AI tools get executable code.

Search via Orama (self-hosted, built into Fumadocs). No automated API docs -- components are "your code" once installed, so no traditional API reference.

### Radix UI

Next.js 14 (Pages Router) + mdx-bundler for runtime MDX compilation. Uses Radix Themes for the site itself.

API props are entirely hand-written as JSX data arrays passed to `<PropsTable data={[...]}/>`. Each entry includes `name`, `type`, `typeSimple`, `default`, `required`, `description`.

Themes Playground at `/themes/playground` -- full interactive page for adjusting color, radius, scaling across all components. Algolia search with autocomplete.

### Chakra UI

Next.js 15 + Velite (static content processor). Four content collections: docs, blogs, guides, showcases.

Custom Velite transforms replace `<ExampleTabs>` with file content and convert `<PropTable>` into markdown tables at build time. Semi-automated API docs via ts-morph (v27).

StackBlitz integration on every example page. Search via Fuse.js + match-sorter.

### MUI

Next.js 15 with custom Markdown (not MDX) processed by `markdown-to-jsx` via a custom webpack loader (`@mui/internal-markdown/loader`).

Fully automated API docs via `@mui-internal/api-docs-builder`: TS AST parsing -> `@babel/traverse` -> `react-docgen` -> `doctrine` (JSDoc) -> structured JSON.

Live editing via `react-runner`. Demo state compressed into shareable URLs via `lz-string`. Dual search: Algolia + flexsearch. PWA with service worker for offline access.

MUI tried Crowdin translations but scaled back -- `LANGUAGES = ['en']` in config. Infrastructure remains but no other locales are built.

### HeroUI (NextUI)

Next.js 15 + Contentlayer2 + Tailwind CSS v4. Three playground systems: Sandpack, react-live, StackBlitz.

API props manually authored as `<APITable data={[...]}/>` in MDX. Search via Algolia + cmdk (Cmd+K palette). Analytics: PostHog + Vercel Analytics.

### Mantine

Next.js 15 hosted on GitHub Pages. MDX via `@next/mdx`. Demos centralized in `@docs/demos` package, referenced as `<Demo data={ButtonDemos.usage} />`.

Semi-automated API docs via `react-docgen-typescript` through `mantine-docgen-script`. Configurator widgets let users toggle props without code editing.

Search uses own `@mantine/spotlight` component -- notable dogfooding. LLMs.txt page with documentation compiled for AI consumption. Help center at `help.mantine.dev`.

### GOV.UK Design System

Metalsmith + Nunjucks (deliberately simple). Content in Markdown with YAML frontmatter. Component examples via Nunjucks macros rendering iframe-based live previews.

No automated API docs. Strict page template: "What it is", "When to use", "When not to use", "How it works", "Research on this component".

Lunr.js search with accessible-autocomplete. Hosted on Netlify with PR previews. Accessibility gold standard.

### Shopify Polaris (Deprecated)

Was one of the most sophisticated: Next.js 15 + Playroom (seek-oss) + custom `get-props` script for automated TS type extraction + VS Code extension + `@shopify/polaris-migrator` CLI + `stylelint-polaris`.

Deprecated October 2025 in favor of Polaris Web Components. Repository is now read-only.

Notable: `X-Robots-Tag: noai, noimageai` header blocking AI crawlers.

### IBM Carbon

Gatsby 5 + `gatsby-theme-carbon` (reusable theme any IBM team can use). MDX with rich global components (ResourceCard, DoDontRow, ArtDirection, etc.).

Storybook serves as the authoritative API reference via `react-docgen-typescript`. Main site has manual MDX tables. Lunr.js search via `react-lunr`.

Multi-version subdomains. Automated dependency update workflow for keeping Gatsby/Carbon deps current. Image optimization CI pipeline.

---

## Key Takeaways

1. **Next.js + MDX dominates** (11/14 use Next.js). Our Astro choice is a minority but well-reasoned for a CSS-first library with zero JS runtime cost.
2. **Every library dogfoods its own DS** on docs -- our dogfooding effort (#365-#369) aligns with universal practice.
3. **i18n is almost nonexistent** -- only Ant Design has real bilingual docs. Not worth investing in until the library has significant non-English adoption.
4. **API docs automation is rare** -- only 4/14 are fully automated. Our existing `api.json` structure is comparable to what most libraries ship.
5. **Algolia is the most common search** (5 libraries), but client-side alternatives (Pagefind, Fuse.js, Lunr.js, Orama) are viable for our scale.
6. **llms.txt is an emerging pattern** -- shadcn, Ant Design, and Mantine already serve AI-optimized content. Low effort, high value.
7. **PR preview deploys are table stakes** -- nearly every library has them. Should be set up for docs-astro.
