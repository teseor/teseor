# Astro Migration Plan

Detailed plan for migrating docs from 11ty/Nunjucks to bare Astro, using our own DS for all styling.

---

## Contract Package (`packages/contract/`)

Shared types + class builders. One file per component mapping props to CSS modifier classes.

### Structure

```
packages/contract/
  src/
    index.ts          # re-exports all component builders
    cx.ts             # class name builder utility
    button.ts         # Button types + class builder
    card.ts           # Card types + class builder
    input.ts          # Input types + class builder
    alert.ts          # Alert types + class builder
    modal.ts          # Modal types + class builder
    ...               # one file per component
  package.json
  tsconfig.json
```

### Example: button.ts

```ts
const VARIANT = {
  primary: 'ui-btn--primary',
  secondary: 'ui-btn--secondary',
  ghost: 'ui-btn--ghost',
  outline: 'ui-btn--outline',
  danger: 'ui-btn--danger',
  link: 'ui-btn--link',
} as const;

const SIZE = {
  sm: 'ui-btn--sm',
  md: '',
  lg: 'ui-btn--lg',
} as const;

export type ButtonVariant = keyof typeof VARIANT;
export type ButtonSize = keyof typeof SIZE;

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  icon?: boolean;
}

export function buttonClass(p: ButtonProps): string {
  return [
    'ui-btn',
    p.variant ? VARIANT[p.variant] : '',
    p.size ? SIZE[p.size] : '',
    p.block ? 'ui-btn--block' : '',
    p.loading ? 'ui-btn--loading' : '',
    p.icon ? 'ui-btn--icon' : '',
  ].filter(Boolean).join(' ');
}
```

### cx.ts (generic class builder)

```ts
type Modifiers = Record<string, string | boolean | undefined>;

export function cx(base: string, modifiers?: Modifiers): string {
  if (!modifiers) return `ui-${base}`;
  const classes = [`ui-${base}`];
  for (const [key, value] of Object.entries(modifiers)) {
    if (typeof value === 'string') {
      classes.push(`ui-${base}--${value}`);
    } else if (value === true) {
      classes.push(`ui-${base}--${key}`);
    }
  }
  return classes.join(' ');
}
```

The contract package can be generated from existing `api.json` files, keeping CSS as the true source of truth. React/Vue/Svelte wrappers will import types from this package.

---

## Astro App Structure (`apps/docs-astro/`)

```
apps/docs-astro/
  astro.config.ts
  package.json
  tsconfig.json
  src/
    layouts/
      DocLayout.astro     # 3-column layout (sidebar | content | TOC)
      BaseLayout.astro    # HTML shell, theme, fonts
    components/
      Sidebar.astro       # built with our nav/menu components
      TableOfContents.astro  # "On this page" anchor nav
      CodePreview.astro   # Preview/Code toggle + copy button
      ApiTable.astro      # renders CSS API from api.json
      ThemeToggle.astro   # dark/light using DS tokens
      SearchModal.astro   # Cmd+K Pagefind search
      DosDonts.astro      # Do/Don't visual guidance
      FrameworkTabs.astro # HTML | React | Vue | Svelte tabs
      ComponentAnatomy.astro  # HTML structure diagram
    pages/
      index.astro         # home page (DS showcase)
      getting-started/
        index.astro       # overview
        [framework].astro # per-framework install guides
      components/
        [slug].astro      # component pages from docs.json
      layout/
        [slug].astro      # layout primitive pages
      utilities/
        [slug].astro      # utility pages
      tokens/
        index.astro       # token overview with visual swatches
        [category].astro  # per-category token docs
      patterns/           # future: task-oriented patterns
    lib/
      docs-loader.ts      # loads docs.json + api.json
      sidebar.ts          # sidebar tree builder
      toc.ts              # heading parser for TOC
    content/
      config.ts           # content collection schemas
    styles/
      global.css          # imports our DS stylesheet
  public/
    fonts/
    favicon.svg
```

---

## Component Page Anatomy (10-section standard)

Every component page follows this exact structure:

```
1. Title + one-line description + status badge (Alpha/Beta/Stable)
2. Live preview (simplest use case, rendered with CodePreview)
3. When to use / When not to use
4. Anatomy (labeled HTML structure diagram)
5. Examples (progressive complexity, each with Preview/Code toggle)
6. CSS API table (tokens, modifiers, custom properties from api.json)
7. Modifiers gallery (all BEM variants rendered visually)
8. Accessibility (ARIA attributes + keyboard interactions table)
9. Framework examples (HTML | React | Vue | Svelte tabs)
10. Related components (links to similar/complementary components)
```

---

## Content Collection Schemas

```typescript
// apps/docs-astro/src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Load api.json files from CSS package
const componentApis = defineCollection({
  loader: glob({
    pattern: '**/**.api.json',
    base: '../../packages/css/src/components',
  }),
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    modifiers: z.record(z.any()).optional(),
    cssVars: z.array(z.object({
      name: z.string(),
      default: z.string(),
      description: z.string().optional(),
    })).optional(),
  }),
});

// Load docs.json files from CSS package
const componentDocs = defineCollection({
  loader: glob({
    pattern: '**/**.docs.json',
    base: '../../packages/css/src/components',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    type: z.enum(['component', 'layout', 'utility', 'config', 'guide']),
    sections: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      items: z.array(z.any()).optional(),
      code: z.string().optional(),
      data: z.record(z.any()).optional(),
    })),
  }),
});

// Layout primitives
const layoutDocs = defineCollection({
  loader: glob({
    pattern: '**/**.docs.json',
    base: '../../packages/css/src/layout',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    type: z.literal('layout'),
    sections: z.array(z.any()),
  }),
});

export const collections = {
  'component-apis': componentApis,
  'component-docs': componentDocs,
  'layout-docs': layoutDocs,
};
```

---

## Sidebar Generation

Read content collections, build tree, render with our DS nav component.

```typescript
// apps/docs-astro/src/lib/sidebar.ts
interface SidebarItem {
  label: string;
  link?: string;
  items?: SidebarItem[];
}

interface DocEntry {
  id: string;
  type: string;
  title: string;
  group?: string;
}

export function buildSidebar(docs: DocEntry[]): SidebarItem[] {
  const groups: Record<string, SidebarItem[]> = {};

  for (const doc of docs) {
    const group = doc.group || doc.type;
    if (!groups[group]) groups[group] = [];
    groups[group].push({
      label: doc.title,
      link: `/${doc.type}s/${doc.id}/`,
    });
  }

  return Object.entries(groups).map(([label, items]) => ({
    label,
    items: items.sort((a, b) => a.label.localeCompare(b.label)),
  }));
}
```

Render with our DS:

```astro
---
// Sidebar.astro
import { buildSidebar } from '../lib/sidebar';
const items = buildSidebar(allDocs);
---
<nav class="ui-sidebar-nav">
  {items.map(group => (
    <details class="ui-disclosure" open>
      <summary class="ui-disclosure__trigger">{group.label}</summary>
      <ul class="ui-menu">
        {group.items?.map(item => (
          <li class="ui-menu__item">
            <a href={item.link} class="ui-link">{item.label}</a>
          </li>
        ))}
      </ul>
    </details>
  ))}
</nav>
```

---

## Pagefind Integration

### Option A: astro-pagefind integration

```typescript
// astro.config.ts
import { defineConfig } from 'astro/config';
import pagefind from 'astro-pagefind';

export default defineConfig({
  integrations: [pagefind()],
  build: { format: 'directory' },
});
```

### Option B: Post-build script

```bash
astro build && npx pagefind --site dist
```

### Search UI component

```astro
---
// SearchModal.astro
---
<div class="ui-modal" id="search-modal" data-search>
  <div class="ui-modal__content">
    <input
      class="ui-input"
      type="search"
      placeholder="Search docs..."
      data-search-input
      autofocus
    />
    <div class="ui-list" data-search-results></div>
  </div>
</div>

<script>
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('search-modal')?.classList.add('ui-modal--open');
      (document.querySelector('[data-search-input]') as HTMLInputElement)?.focus();
    }
  });

  // Pagefind initializes after build
  async function initSearch() {
    // @ts-expect-error -- pagefind injected at build time
    const pagefind = await import('/pagefind/pagefind.js');
    await pagefind.init();

    const input = document.querySelector('[data-search-input]') as HTMLInputElement;
    const results = document.querySelector('[data-search-results]') as HTMLElement;

    input?.addEventListener('input', async () => {
      const search = await pagefind.search(input.value);
      const items = await Promise.all(search.results.slice(0, 10).map((r: any) => r.data()));
      results.innerHTML = items.map((item: any) =>
        `<a href="${item.url}" class="ui-list__item ui-link">${item.meta.title}</a>`
      ).join('');
    });
  }

  initSearch();
</script>
```

---

## Example .astro Components

### DocLayout.astro

```astro
---
import Sidebar from '../components/Sidebar.astro';
import TableOfContents from '../components/TableOfContents.astro';
import ThemeToggle from '../components/ThemeToggle.astro';

interface Props {
  title: string;
  headings?: { depth: number; slug: string; text: string }[];
}

const { title, headings = [] } = Astro.props;
---
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>{title} | UI Lib</title>
  <link rel="stylesheet" href="/styles/global.css" />
</head>
<body class="ui-app-shell">
  <header class="ui-app-shell__header">
    <a href="/" class="ui-link">UI Lib</a>
    <ThemeToggle />
  </header>

  <div class="ui-app-shell__body">
    <aside class="ui-app-shell__sidebar">
      <Sidebar />
    </aside>

    <main class="ui-app-shell__main ui-container">
      <slot />
    </main>

    {headings.length > 0 && (
      <aside class="ui-app-shell__aside">
        <TableOfContents headings={headings} />
      </aside>
    )}
  </div>
</body>
</html>
```

### CodePreview.astro

```astro
---
interface Props {
  title?: string;
  code: string;
  lang?: string;
}

const { title, code, lang = 'html' } = Astro.props;
---
<div class="ui-card">
  {title && <div class="ui-card__header"><h3 class="ui-heading--sm">{title}</h3></div>}

  <div class="ui-card__body" data-preview>
    <slot name="preview" />
  </div>

  <details class="ui-disclosure">
    <summary class="ui-disclosure__trigger">
      Show code
    </summary>
    <div class="ui-code-block" data-code>
      <button class="ui-btn--ghost ui-btn--sm" data-copy>Copy</button>
      <pre><code class={`language-${lang}`}>{code}</code></pre>
    </div>
  </details>
</div>

<script>
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('[data-code]')?.querySelector('code')?.textContent;
      if (code) navigator.clipboard.writeText(code);
    });
  });
</script>
```

### ApiTable.astro

```astro
---
interface CssVar {
  name: string;
  default: string;
  description?: string;
}

interface Props {
  modifiers?: Record<string, string>;
  cssVars?: CssVar[];
}

const { modifiers = {}, cssVars = [] } = Astro.props;
---
{Object.keys(modifiers).length > 0 && (
  <section>
    <h3 class="ui-heading--sm">Modifiers</h3>
    <table class="ui-table">
      <thead>
        <tr>
          <th>Class</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(modifiers).map(([cls, desc]) => (
          <tr>
            <td><code>{cls}</code></td>
            <td>{desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
)}

{cssVars.length > 0 && (
  <section>
    <h3 class="ui-heading--sm">CSS Custom Properties</h3>
    <table class="ui-table">
      <thead>
        <tr>
          <th>Property</th>
          <th>Default</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {cssVars.map(v => (
          <tr>
            <td><code>{v.name}</code></td>
            <td><code>{v.default}</code></td>
            <td>{v.description || ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
)}
```

### Component Page ([slug].astro)

```astro
---
import DocLayout from '../../layouts/DocLayout.astro';
import CodePreview from '../../components/CodePreview.astro';
import ApiTable from '../../components/ApiTable.astro';
import { loadAllDocs } from '../../lib/docs-loader';

export async function getStaticPaths() {
  const docs = await loadAllDocs();
  return docs
    .filter(d => d.type === 'component')
    .map(doc => ({
      params: { slug: doc.id },
      props: { doc },
    }));
}

const { doc } = Astro.props;
---
<DocLayout title={doc.title}>
  <h1 class="ui-heading">{doc.title}</h1>
  <p>{doc.description}</p>

  {doc.sections.map(section => (
    <section>
      <h2 class="ui-heading--md" id={section.title.toLowerCase().replace(/\s/g, '-')}>
        {section.title}
      </h2>
      {section.description && <p>{section.description}</p>}

      {section.code && (
        <CodePreview code={section.code}>
          <div slot="preview" set:html={section.code} />
        </CodePreview>
      )}
    </section>
  ))}

  <ApiTable modifiers={doc.api?.modifiers} cssVars={doc.api?.cssVars} />
</DocLayout>
```

---

## Migration Phases

### Phase 0: Contract package (~1-2 days)

- Create `packages/contract/` with shared types + class builders
- One file per component: `button.ts`, `card.ts`, `input.ts`, `alert.ts`, `modal.ts`
- `cx()` utility for generic class building
- Generate from existing `api.json` files
- Unit tests for class builders

### Phase 1: Astro app scaffold (~2-3 days)

- New `apps/docs-astro/` (parallel to `apps/docs-css/` during migration)
- Astro + content collections consuming existing `api.json` / `docs.json`
- Core `.astro` components: DocLayout, Sidebar, ThemeToggle, CodePreview, ApiTable
- All styling from our DS -- zero external CSS
- Pagefind integration via post-build

### Phase 2: Migrate component pages (~3-5 days)

- Port docs.json rendering to Astro `getStaticPaths()` + page templates
- Standardize page anatomy (10 sections)
- Type-safe `.astro` components importing from contract
- Top 10 components first, then remaining

### Phase 3: Content enrichment (ongoing)

- Do/Don't guidance for key components
- Accessibility sections (ARIA + keyboard tables)
- Framework tabs skeleton (HTML | React | Vue | Svelte)
- Improved token docs with visual swatches
- Per-framework getting-started guides

### Phase 4: Advanced features (later)

- Patterns section (form layout, loading states, navigation patterns)
- Component maturity badges (Alpha/Beta/Stable)
- Interactive token explorer
- "Was this helpful?" feedback widget
- Prev/next page navigation

---

## Verification Criteria

- Every component page has all 10 sections from the anatomy
- Search finds any component/token in <3 keystrokes
- Code examples render preview above code with copy button
- 3-column layout works on desktop; collapses gracefully on mobile
- All code blocks have syntax highlighting
- Token docs show visual swatches
- Getting started works for CDN, npm, and at least 2 frameworks
- Lighthouse accessibility score >95 on all docs pages
- Zero external CSS -- only our DS loaded
