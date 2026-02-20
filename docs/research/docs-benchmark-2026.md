# Documentation Benchmark Research (2026)

Research across 36 design system and component library documentation sites to identify best practices for structure, visual design, content patterns, navigation, and multi-framework support.

Goal: redesign our docs to match best-in-class standards as the library evolves from CSS-only to CSS + React/Vue/Svelte/Angular.

---

## Library Ratings

Sorted by score. Evaluated on: page structure, navigation, search, code examples, accessibility docs, token docs, visual design, multi-framework support.

| # | Library | Type | Rating | Standout Feature |
|---|---------|------|--------|------------------|
| 1 | Adobe Spectrum | Corporate DS | 9/10 | Most thorough component specs + multi-framework |
| 2 | Apple HIG | Design Guidelines | 9/10 | Design rationale depth, cross-platform |
| 3 | Ant Design | Component Lib | 8.5/10 | Live demos + 3-layer token system + FAQ per component |
| 4 | Ark UI | Headless Lib | 8.5/10 | Best multi-framework docs (4 frameworks, every example) |
| 5 | Atlassian DS | Corporate DS | 8/10 | Token picker tool + maturity badges |
| 6 | GOV.UK DS | Government DS | 8/10 | Research-backed decisions + Patterns section |
| 7 | Material Design 3 | Design Spec | 8/10 | 4-tab structure (Overview/Guidelines/Specs/A11y) |
| 8 | Primer (GitHub) | Corporate DS | 8/10 | Multi-framework badges + accessibility top-level |
| 9 | Tailwind CSS | CSS Framework | 8/10 | Search-first UX, exhaustive utility reference |
| 10 | Polaris (Shopify) | Corporate DS | 7.5/10 | Content guidelines + Do/Don't + patterns |
| 11 | DaisyUI | CSS Components | 7.5/10 | 40+ framework guides + theme generator |
| 12 | Carbon (IBM) | Corporate DS | 7.5/10 | 5 framework tabs + Do/Don't rows |
| 13 | Shadcn/ui | Component Lib | 7.5/10 | Copy-paste model, clean minimal docs |
| 14 | Fluent 2 (MS) | Corporate DS | 7/10 | Cross-platform (Web/iOS/Android/Windows) |
| 15 | Vercel Geist | Corporate DS | 7/10 | Visual minimalism + functional color scale |
| 16 | Open Props | CSS Tokens | 7/10 | Interactive playgrounds (shadow, color) |
| 17 | Pico CSS | CSS Framework | 7/10 | Semantic HTML teaching + class-less approach |
| 18 | v0.app | AI Tool | 7/10 | AI-native registry distribution |
| 19 | MUI | Component Lib | 7/10 | Live demos + CodeSandbox/StackBlitz links |
| 20 | Radix UI | Headless Lib | 7/10 | A11y docs (WAI-ARIA + keyboard tables) |
| 21 | Chakra UI | Component Lib | 7/10 | Progressive disclosure + 3-column layout |
| 22 | Untitled UI | Component Lib | 6.5/10 | Modern visual design + CLI-first |
| 23 | Halfmoon | CSS Framework | 6.5/10 | Bootstrap drop-in + 3 built-in themes |
| 24 | Nord Health | Corporate DS | 6.5/10 | Web Components + clean token docs |
| 25 | UIkit | CSS Framework | 6/10 | Preview/Markup tabs + migration guide |
| 26 | Salesforce SLDS | Corporate DS | 6/10 | AI-ready designations + developer tools |
| 27 | Uniform (Hudl) | Corporate DS | 6/10 | Dual-audience (designer/developer) |
| 28 | BBC GEL | Corporate DS | 6/10 | Technical writing quality |
| 29 | GitLab Pajamas | Corporate DS | 6/10 | Vue-first + Figma integration |
| 30 | Twilio Paste | Corporate DS | 6/10 | Tokens + usage guidelines |
| 31 | Mozilla Protocol | CSS Pattern Lib | 5.5/10 | Simple, focused scope |
| 32 | Circuit (SumUp) | Corporate DS | 5/10 | Storybook-based (cautionary example) |
| 33 | Practical UI | Educational | 5/10 | Teaching design decisions |
| 34 | Bulma | CSS Framework | 5/10 | Mature but aging docs |
| 35 | Materialize CSS | CSS Framework | 4.5/10 | Dated, no modern affordances |
| 36 | Pure CSS | CSS Framework | 4/10 | Minimal to a fault |

---

## Top 10 Patterns to Adopt

Ranked by impact on developer experience.

### 1. Consistent component page anatomy

**Who does it best**: Ark UI, Material Design 3, Adobe Spectrum

Every component page follows the exact same structure:

1. Title + one-line description
2. Live preview (simplest use case)
3. When to use / When not to use
4. Anatomy (HTML structure diagram)
5. Examples (progressive complexity, with Preview/Code tabs)
6. CSS API table (tokens, modifiers, custom properties)
7. Modifiers gallery (all BEM variants, visual)
8. Accessibility (ARIA attributes + keyboard interactions table)
9. Framework examples (HTML | React | Vue | Svelte tabs)
10. Related components

### 2. Framework switching via tabs

**Who does it best**: Ark UI, Carbon

Ark UI uses URL-based separation (`/react/docs/...`, `/vue/docs/...`) with a framework switcher in nav. Every code example has parallel implementations. Carbon uses tabs on each component page.

For us: CSS is the core, so HTML+CSS is always the default tab. Framework tabs show wrapper usage. Start with HTML-only; add React/Vue/Svelte tabs as wrappers ship.

### 3. Preview/Code toggle on every example

**Who does it best**: Shadcn/ui, Chakra, UIkit, Untitled UI

Show the rendered component first (visual), with a "Show Code" toggle to reveal source. Copy button on every code block. Keeps pages scannable while code is always accessible.

### 4. Do/Don't guidance

**Who does it best**: Material Design 3, Adobe Spectrum, Polaris, Carbon

Side-by-side images with green check / red X showing correct vs. incorrect usage. Absent from almost all CSS-only frameworks -- major differentiation opportunity.

### 5. Search (fast, full-text)

**Who does it best**: Tailwind (Algolia), Atlassian, MUI

Developers expect answers in <10 seconds. Cmd+K command palette search is the modern standard.

### 6. Three-column layout

**Who does it best**: Chakra, MUI, Shadcn/ui, Primer

Left sidebar (nav) | Center (content) | Right sidebar ("On this page" anchors). Expected layout for any docs site with >20 pages.

### 7. Token documentation with visual swatches

**Who does it best**: Atlassian (token picker), Primer (9-theme explorer), Geist (functional scale)

Tokens shown with: visual swatch, CSS variable name, computed value, copy-to-clipboard. Semantic grouping (backgrounds, borders, text).

### 8. Patterns/Recipes section (beyond components)

**Who does it best**: GOV.UK, Polaris, Carbon

Task-oriented pages: "Form layout patterns," "Loading states," "Error handling," "Navigation patterns." These document compositions of components, not just individual widgets.

### 9. Research-backed design decisions

**Who does it best**: GOV.UK

Component docs cite user research: "Testing showed green start buttons improved click-through rates." Builds trust. We can start small: explain the "why" behind key decisions.

### 10. Getting started with framework-specific paths

**Who does it best**: DaisyUI (40+ framework guides), Shadcn/ui, Chakra

Separate installation page per framework. User chooses stack once, sees relevant code throughout. For us: HTML/CDN (default), then Vite, Next.js, Nuxt, SvelteKit, Astro, etc.

---

## Component Frequency Across 20 Libraries

~150 components grouped by category. Number indicates how many of 20 surveyed libraries include this component.

### Layout

| Component | Frequency | Aliases |
|-----------|-----------|---------|
| Grid/Columns | 20/20 | |
| Container | 18/20 | |
| Divider/Separator | 17/20 | |
| Stack/Flex | 16/20 | |
| Box | 14/20 | |
| Columns | 12/20 | |
| Spacer | 10/20 | |
| AspectRatio | 8/20 | Ratio |
| Sidebar layout | 8/20 | |
| Hero/Banner | 8/20 | |
| Center | 6/20 | |
| Footer | 6/20 | |
| Header | 6/20 | AppBar (layout shell) |

### Navigation

| Component | Frequency | Aliases |
|-----------|-----------|---------|
| Tabs | 20/20 | TabGroup, TabList |
| Breadcrumb | 19/20 | |
| Pagination | 18/20 | Pager |
| Nav/Navbar | 17/20 | TopNav, HeaderNav |
| Menu | 16/20 | NavMenu, SideMenu |
| Dropdown Menu | 16/20 | ContextMenu, ActionMenu |
| Link | 16/20 | Anchor, TextLink |
| Sidebar Nav | 12/20 | SideNav, VerticalNav |
| Steps/Stepper | 12/20 | Wizard, ProgressSteps |
| TreeView | 8/20 | |
| Skip Link | 6/20 | SkipNav |
| Back to Top | 5/20 | ScrollToTop |
| Command Palette | 4/20 | CommandMenu, Spotlight |

### Forms / Data Entry

| Component | Frequency | Aliases |
|-----------|-----------|---------|
| Button | 20/20 | |
| Input/TextField | 20/20 | |
| Select | 20/20 | Dropdown, Picker |
| Checkbox | 20/20 | |
| Radio | 20/20 | RadioGroup |
| Toggle/Switch | 19/20 | |
| Textarea | 18/20 | |
| Form/FormGroup | 17/20 | FormControl, FormField |
| Slider/Range | 16/20 | |
| DatePicker | 14/20 | Calendar, DateInput |
| File Upload | 13/20 | Dropzone, FileInput |
| Label | 12/20 | FormLabel |
| Autocomplete/Combobox | 12/20 | TypeAhead, SearchInput |
| Search | 10/20 | SearchBar, SearchField |
| NumberInput | 10/20 | NumberField, Stepper |
| Segmented Control | 8/20 | ToggleGroup |
| Fieldset | 8/20 | FormSection |
| ColorPicker | 8/20 | |
| TimePicker | 8/20 | |
| Rating/Stars | 8/20 | |
| Pin Input/OTP | 6/20 | VerificationInput |
| Transfer | 4/20 | DualListBox |
| Cascader | 3/20 | CascadeSelect |
| Mentions | 3/20 | MentionInput |

### Data Display

| Component | Frequency | Aliases |
|-----------|-----------|---------|
| Table/DataTable | 19/20 | |
| Card | 19/20 | Panel, Tile |
| Tooltip | 19/20 | Hint |
| Avatar | 18/20 | |
| Badge | 18/20 | Counter, Indicator, Lozenge |
| Accordion/Collapse | 18/20 | Disclosure, Expandable |
| Tag/Chip | 17/20 | Token, Label, Pill |
| List | 16/20 | ListView, ResourceList |
| Collapse | 12/20 | Expandable, Collapsible |
| Code/CodeBlock | 10/20 | CodeSnippet, SyntaxHighlight |
| Carousel | 10/20 | Slider (content), Slideshow |
| Empty State | 10/20 | BlankSlate, NoData |
| Stat/Metric | 8/20 | Statistic, DataPoint |
| Calendar | 8/20 | DateDisplay |
| Timeline | 8/20 | Feed |
| Kbd | 8/20 | Keyboard, KeyboardShortcut |
| Description List | 7/20 | DefinitionList, KeyValue |
| Tree (data display) | 6/20 | |
| Comment | 4/20 | Discussion |

### Feedback

| Component | Frequency | Aliases |
|-----------|-----------|---------|
| Alert/Banner | 19/20 | InlineMessage |
| Spinner/Loader | 18/20 | CircularProgress |
| Progress/ProgressBar | 18/20 | LinearProgress |
| Toast/Snackbar | 17/20 | Notification (floating), Flash |
| Skeleton | 15/20 | Placeholder, ShimmerLoading |
| Notification | 14/20 | |
| Banner/Announcement | 12/20 | TopBanner |
| Message/Callout | 10/20 | InlineAlert |
| Result/StatusPage | 5/20 | Outcome |
| ErrorBoundary | 4/20 | ErrorFallback |

### Overlays

| Component | Frequency | Aliases |
|-----------|-----------|---------|
| Modal/Dialog | 20/20 | |
| Dialog/AlertDialog | 18/20 | ConfirmDialog |
| Popover | 17/20 | Popup, Flyout |
| Drawer/SideSheet | 16/20 | SidePanel, OffCanvas |
| Overlay/Backdrop | 10/20 | Scrim |
| Sheet/BottomSheet | 8/20 | ActionSheet |
| Command Dialog | 4/20 | CommandPalette, kbar |
| Lightbox | 4/20 | ImageViewer |

### Actions

| Component | Frequency | Aliases |
|-----------|-----------|---------|
| Button Group | 16/20 | ButtonToolbar, ActionGroup |
| Icon Button | 14/20 | ActionButton, ToolbarButton |
| Close Button | 12/20 | DismissButton |
| Dropdown Button | 10/20 | SplitButton, MenuButton |
| FAB/SpeedDial | 6/20 | |
| Action Bar | 6/20 | Toolbar |
| Copy Button | 5/20 | CopyToClipboard |

### Typography

| Component | Frequency | Aliases |
|-----------|-----------|---------|
| Heading | 16/20 | Title, H1-H6, DisplayText |
| Text/Paragraph | 15/20 | Body, Typography |
| Link | 16/20 | Anchor, TextLink |
| Code/InlineCode | 12/20 | Mono |
| Blockquote | 10/20 | Quote, Callout |
| Highlight/Mark | 6/20 | TextHighlight |
| Truncate | 5/20 | TextOverflow, Ellipsis |
| Prose | 4/20 | RichText, Article |

### Content / Media

| Component | Frequency | Aliases |
|-----------|-----------|---------|
| Icon | 16/20 | SvgIcon, Glyph |
| Image | 14/20 | Picture, Responsive Image |
| Scroll Area | 8/20 | ScrollContainer, Scrollbar |
| Media Object | 6/20 | MediaLayout |
| AspectRatio | 6/20 | Ratio |
| Figure/Caption | 5/20 | ImageCaption |
| Video | 5/20 | VideoPlayer |

### Utilities

| Component | Frequency | Aliases |
|-----------|-----------|---------|
| Visually Hidden | 12/20 | ScreenReaderOnly, SrOnly |
| Theme Provider | 10/20 | ThemeContext, ColorMode |
| Portal/Teleport | 10/20 | |
| Transition/Motion | 10/20 | Animation, Fade |
| Focus Trap | 8/20 | FocusLock, FocusScope |
| CSS Reset | 8/20 | Normalize, Preflight |
| Show/Hide | 8/20 | Display, Responsive |
| Click Outside | 4/20 | ClickAway, DismissHandler |
| Announce | 3/20 | LiveRegion, AriaLive |
| Resize Observer | 3/20 | MeasureElement |

Most universal: Button, Input, Select, Checkbox, Radio, Modal/Dialog, Grid, Tabs, Alert (19-20/20). Least common but notable (2-4): Transfer, Cascader, Mentions, Lightbox, Command Palette -- only in comprehensive libraries like Ant Design, MUI, Fluent.

---

## Current Gaps Analysis

| # | Gap | Current State | Target State | Priority |
|---|-----|--------------|--------------|----------|
| 1 | No search | None | Pagefind (Cmd+K) | High |
| 2 | No "On This Page" sidebar | Single column | 3-column layout with anchor nav | High |
| 3 | Inconsistent page anatomy | Varies by component | Fixed 10-section structure | High |
| 4 | No Preview/Code toggle | Static code blocks | Interactive preview + collapsible code + copy | High |
| 5 | No framework tabs | HTML only | HTML / React / Vue / Svelte tabs (future-ready) | Medium |
| 6 | No Do/Don't guidance | None | Visual do/don't per component | Medium |
| 7 | No "When to use" | None | Purpose + when to use/not use | Medium |
| 8 | No Patterns section | Components only | Task-oriented patterns (form layout, loading, errors) | Medium |
| 9 | No getting-started paths | Single page | Per-framework install guides | Medium |
| 10 | Weak token docs | Basic listing | Visual swatches + copy + semantic grouping | Medium |
| 11 | No accessibility per component | Sparse | ARIA attributes + keyboard interactions table | Medium |
| 12 | No anatomy diagrams | None | Labeled HTML structure diagrams | Lower |
| 13 | No component maturity badges | None | Alpha/Beta/Stable indicators | Lower |
| 14 | No prev/next navigation | None | Sequential component browsing | Lower |
| 15 | No feedback widget | None | "Was this helpful?" | Lower |

---

## Visual Design Recommendations

Based on highest-rated docs (Spectrum 9, Apple HIG 9, Ant Design 8.5, Ark UI 8.5).

| Aspect | Recommendation | Reference |
|--------|---------------|-----------|
| Layout | 3-column: 240px sidebar + fluid content + 200px anchor nav | Chakra, Shadcn, MUI |
| Typography | 2 fonts: sans-serif body + monospace code. Clear heading hierarchy. | MUI (General Sans + IBM Plex Sans) |
| Whitespace | Generous. One concept per section. Breathing room between examples. | Shadcn, Geist |
| Code blocks | Dark background, syntax highlighting, copy button, expandable | Shadcn, Ant Design |
| Preview area | Light bordered container above code, shows rendered output | DaisyUI, UIkit, Chakra |
| Colors | Neutral base + single accent color. Light/dark mode toggle. | Geist, Pico |
| Information density | Medium -- not sparse (Geist) nor overwhelming (MUI). Balanced. | Chakra, GOV.UK |
| Navigation | Sticky sidebar, collapsible sections, Cmd+K search | Tailwind, Shadcn |

---

## Community Sentiment

### Top 5 Praised Patterns

#### 1. Progressive disclosure with layered content

Developers want quickstart guides for immediate wins, conceptual overviews for mental models, and comprehensive references for deep dives. Stripe's three-layer approach (quickstart -> concepts -> API reference) is consistently cited as the gold standard. Django, FastAPI, and Vue.js praised for the same pattern.

Sources: [Stripe Docs Teardown (Moesif)](https://www.moesif.com/blog/best-practices/api-product-management/the-stripe-developer-experience-and-docs-teardown/), [Why Stripe's Docs Are the Benchmark (Apidog)](https://apidog.com/blog/stripe-docs/), [HN: Good Documentation Examples](https://news.ycombinator.com/item?id=33682599)

#### 2. Live, interactive code examples

Copy-paste-ready code that actually works is non-negotiable. Strongest praise for: personalized code samples (Stripe auto-injects test API keys), one-click language switching, StackBlitz/CodeSandbox embedding, and Stripe Shell (live API calls in docs). Static code blocks without interactivity increasingly seen as outdated.

Sources: [Stripe Docs Analysis (Apidog)](https://apidog.com/blog/stripe-docs/), [Design System Documentation Best Practices (Backlight)](https://backlight.dev/blog/design-system-documentation-best-practices)

#### 3. Clear, consistent page structure

Every component page following the same anatomy. Developers build muscle memory for where to find props, examples, accessibility notes, and related components. Polaris's consistent 8-section pattern and Primer's tabbed approach praised for predictability.

Sources: [UXPin Design System Documentation](https://www.uxpin.com/studio/blog/7-best-practices-for-design-system-documentation/), [Best Design Systems 2025 (Dumbo)](https://dumbo.design/en/insights/best-design-systems-in-2025/)

#### 4. Real-world usage guidance (Do/Don't)

Developers praise docs that show not just how to use something, but when and why. Carbon's visual Do/Don't rows, Polaris's content guidelines with good/bad writing examples, Primer's accessibility status badges all receive positive mentions.

Sources: [13 Best Design System Examples (UXPin)](https://www.uxpin.com/studio/blog/best-design-system-examples/), [Design System Documentation Best Practices (Backlight)](https://backlight.dev/blog/design-system-documentation-best-practices)

#### 5. Robust search and navigation

Left-panel navigation with clear hierarchy, "On this page" anchor sidebars, and fast full-text search. Developers want answers in under 10 seconds. Stripe's three-column layout (nav | content | code) cited as optimal for developer flow.

Sources: [Design System Documentation Best Practices (Backlight)](https://backlight.dev/blog/design-system-documentation-best-practices), [HN: Good Documentation Examples](https://news.ycombinator.com/item?id=33682599)

### Top 5 Complaints

#### 1. Outdated or incomplete documentation

The single most common complaint. Features exist in code but not in docs. Examples use deprecated APIs. 45% of developers in the 2025 Stack Overflow survey cite "solutions that are almost right, but not quite" as their top frustration.

Sources: [Stack Overflow 2025 Developer Survey](https://stackoverflow.blog/2025/12/29/developers-remain-willing-but-reluctant-to-use-ai-the-2025-developer-survey-results-are-here), [9 Pain Points (Jellyfish)](https://jellyfish.co/library/developer-productivity/pain-points/)

#### 2. No working examples or non-runnable code

Static code blocks that don't compile, missing imports, undeclared variables, or examples that only work in an unstated context. Developers want to copy, paste, and run. When they can't, trust evaporates immediately.

Sources: [HN: Good Documentation Examples](https://news.ycombinator.com/item?id=33682599), [Stripe Docs Analysis (Apidog)](https://apidog.com/blog/stripe-docs/)

#### 3. Poor organization and missing navigation

Documentation requiring 5+ clicks to find a specific prop. No search, no sidebar anchors, no breadcrumbs. Information scattered across blog posts, READMEs, GitHub issues, and wiki pages instead of one canonical location.

Sources: [Design System Documentation Best Practices (Backlight)](https://backlight.dev/blog/design-system-documentation-best-practices), [10 Developer Pain Points (Develocity)](https://develocity.io/10-developer-pain-points-that-kill-productivity/)

#### 4. No guidance on when to use what

API reference without context. 12 button variants documented with props but no explanation of which to use when. Developers complain about reverse-engineering design intent from code. Missing migration guides between versions.

Sources: [13 Best Design System Examples (UXPin)](https://www.uxpin.com/studio/blog/best-design-system-examples/), [Best Design Systems 2025 (Dumbo)](https://dumbo.design/en/insights/best-design-systems-in-2025/)

#### 5. Single-framework bias

Documentation only showing React examples when the system claims multi-framework support. Framework-specific jargon in supposedly framework-agnostic docs. Carbon praised for 5 frameworks; many others criticized for React-only examples.

Sources: [Builder.io React UI Libraries 2026](https://www.builder.io/blog/react-component-libraries-2026), [Design System Documentation (Supernova)](https://www.supernova.io/blog/design-system-documentation-why-you-need-it-and-how-to-do-it)

### Libraries Repeatedly Mentioned as "The Best Docs"

| Library | Why |
|---------|-----|
| Stripe | Three-column layout, personalized code samples, one-click language switching, live API shell. "The benchmark." |
| Django | Great examples, version switching, clear version change notes. Professional tech writers. |
| Tailwind CSS | Exhaustive utility reference, search-first UX, every class documented with visual output. |
| PostgreSQL | "Top notch" reference material. Comprehensive, consistent, deeply technical. |
| FastAPI | "Clear and easy to follow language with awesome examples." Concepts alongside API reference. |
| Vue.js | Dual structure (API reference + guides). Gets beginners productive fast. |
| PHP Manual | Clear function signatures, edge-case examples, separate pages per method, community comments. |
| Rust | Compiler error messages as inline documentation. "Exactly when you need it most." |
| Shadcn/ui | Copy-paste model with full code ownership. Clean, minimal. CLI-first installation. |

### Trends (2024-2026)

1. **Documentation as a product** -- treated with same rigor as code: roadmaps, dedicated writers, user research, feedback loops. "Documentation is part of done."
2. **Interactive-first over static** -- StackBlitz, CodeSandbox, embedded playgrounds replacing static code blocks. Expectation: every example runnable without leaving docs.
3. **Token-driven design systems** -- tokens as single source of truth, documented with visual swatches, copy-to-clipboard, cross-theme previews. Primer's 9-theme explorer is the high bar.
4. **Headless/ownership-first architecture** -- shadcn/ui's model (copy code, own it, customize freely) influenced docs design across ecosystem. 70% adoption growth for headless components in 2025.
5. **Accessibility as first-class documentation** -- Primer elevating accessibility to top-level section. Component-level a11y status, WCAG mapping, keyboard interaction tables expected on every page.
6. **Multi-audience documentation** -- separating paths for designers (Figma setup), developers (framework guides), content authors (writing guidelines). Audience-specific entry points converging on shared component docs.
7. **Dark mode and responsive docs sites** -- docs expected to practice what they preach. If your DS supports dark mode, docs must demonstrate it.

---

## Tech Stack Decision

### Decision: Bare Astro (no Starlight)

### Why Starlight Was Rejected

Starlight always loads its 8 CSS files + per-component scoped styles. You can override via cascade layers, but you cannot remove Starlight's CSS. Problems:

- Two competing CSS systems loaded (our DS + Starlight's) -- debugging nightmares
- Starlight's reset conflicts with our DS reset
- Phantom styles leak through in edge cases
- `customCss` config adds CSS, doesn't replace it
- Full override (~25 components + CSS suppression) = ~30-50 hours -- MORE than building from scratch

Things you CANNOT avoid with Starlight:

1. Starlight's CSS always loads -- 8 style files and `props.css` injected even with every component overridden
2. The reset is applied -- if your DS has its own reset, they conflict within the cascade
3. Slot architecture -- cannot change the `PageFrame` slot contract, only render inside slots
4. Content rendering pipeline -- Starlight processes Markdown through its own pipeline and applies `markdown.css`
5. JavaScript behaviors -- theme toggling, mobile menu, search modal have JS you must reimplement
6. `data-*` attributes on `<html>` -- some CSS references these even in components you did NOT override
7. Virtual modules -- working within Starlight's module system, not around it

Real-world validation: [A developer tried this for a DS docs site](https://www.blind3y3design.com/writing/2024/starlight-design-system-docs/) and hit high-specificity fights, `!important` requirements, and silent failures.

### Why Bare Astro Wins

| Feature | Starlight (built-in) | Bare Astro (rebuild) | Effort |
|---------|---------------------|---------------------|--------|
| Search | Pagefind built-in | `astro-pagefind` plugin | ~2-4h |
| Sidebar | Auto-generated | Build from content collection | ~4-8h |
| Dark mode | Built-in | localStorage + our DS tokens | ~1-2h |
| Table of contents | Auto-generated | Parse headings | ~2-4h |
| Prev/next nav | Automatic | Derive from sort order | ~1-2h |
| Edit links | Config option | Template string | ~30min |
| **Total** | **Free** | | **~15-25h** |

Benefits:

1. **Zero phantom CSS** -- our DS is the only CSS loaded. Every page proves the system works.
2. **Less effort** than full Starlight override (15-25h vs 30-50h)
3. **Zero maintenance risk** -- no Starlight updates introducing CSS conflicts
4. **Docs site IS the showcase** -- our grid, sidebar, header, cards all use our own components. Real dog-fooding.
5. **Same type-safe `.astro` components** -- `interface Props`, slots, content collections all work identically
6. **Pagefind is framework-agnostic** -- biggest Starlight feature works the same outside it

### Why Not the Others

| | 11ty + TS Shortcodes | Astro Custom | Astro + Starlight | VitePress |
|---|---|---|---|---|
| Type safety at call site | None (templates untyped) | Full | Full | Full |
| Composability | Poor (no slots) | Excellent | Excellent | Good |
| Search | DIY | DIY | Pagefind (free) | minisearch |
| Dark mode, sidebar, TOC | DIY | DIY | Built-in | Built-in |
| Framework tabs | DIY | Astro Islands | Built-in `<Tabs>` | Vue only |
| docs.json/api.json fit | Direct JS | Content Collections | Content Collections | Awkward (markdown strings) |
| Migration effort | Low | Medium-High | Medium-High | High |
| Framework neutrality | Yes | Yes | Yes | Vue-biased |

- **11ty + TS**: Solves nothing meaningful. Call sites remain untyped, no built-in features.
- **Astro + Starlight**: Phantom CSS is a real problem for dog-fooding. Override cost exceeds rebuild cost.
- **VitePress**: Markdown-string generation for programmatic pages fundamentally awkward for structured JSON data. Vue lock-in conflicts with CSS-first, framework-agnostic positioning.
