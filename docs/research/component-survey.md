# Component competitive survey

Phase 1 survey of components across the design-system landscape. The output is a ranked backlog for what Teseor builds next, with explicit dogfood-the-docs framing.

| | |
| --- | --- |
| Survey date | 2026-06-21 |
| Systems surveyed | 50 across 10 families (Phase 1 + 1b) |
| Raw component entries collected | 2050 |
| Consensus components after clustering | 158 |
| Teseor shipped today | 9 (button, cluster, code, codeblock, modal, pagination, stack, tablist, tooltip) |
| Per-component detail | `docs/research/component-survey-cards.md` — props observed, a11y notes, design choices, source URLs for the actionable bucket (covered + P1) |
| Synthesis scripts (committed, reproducible) | `docs/research/_component-survey/{consolidate,render-doc,render-cards}.mjs` |
| Raw per-system data (gitignored, large) | `.local/component-survey/raw-workflow-output.json` + `raw-workflow-1b-output.json` |

## Methodology

- **Phase 1.** 8 read-only agents fanned out across 44 design systems (headless / opinionated React / brand-enterprise / Tailwind-ecosystem / CSS-only / form-specific / niche surfaces), each pulling per-component metadata (name, category, key props, ARIA notes, design choices, source URL) via Context7 and direct doc fetches. Agents recorded observations only — they did not propose canonical names or pick winners.
- **Phase 1b.** 2 follow-up agents covered 6 docs-platform component shelves (Docusaurus, Nextra, VitePress, Mintlify, Astro Starlight, Tailwind Typography prose plugin) to fill the docs-composite vocabulary (Callout/Admonition, CodeGroup, Steps, Cards, FileTree, etc.) the main wave underweighted.
- **Consolidation.** A scripted normalizer collapsed package prefixes, part suffixes (`Tabs.Root` → `Tabs`), pluralization, and a hand-curated synonym map onto canonical concept names. ~158 consensus concepts emerged; the long tail is hooks, infrastructure components (Portal, Slot, CssBaseline), and system-unique single-mentions.
- **Phase 2 (this doc, lower sections).** Each consensus concept is tagged as `doc-relevant`, `app-relevant`, or `both`, mapped against Teseor's current spec set, and bucketed into priority lanes.
- **Phase 3 (next session).** User locked the synthesis defaults on 2026-06-21: renames held (no batch commits — discuss per-component during synthesis), attack order is **P1-docs-and-app first**, docs-platform wave was run.
- **Phase 4.** File issues per component (or per closely-related cluster), top of P1-docs-and-app first. One issue ships, then next.

### Reproducing the synthesis

The synonym map, dogfood-relevance tagging, and bucket assignment are encoded as code, not prose, so they're auditable and re-runnable:

1. Re-run the survey workflows (Phase 1 + Phase 1b — each agent reads design-system docs via Context7 / WebFetch and emits structured JSON per system). Output lands as raw JSON in `.local/component-survey/`.
2. `node docs/research/_component-survey/consolidate.mjs` — merges raw waves, applies synonym clustering, writes `consolidated.json`.
3. `node docs/research/_component-survey/render-doc.mjs` — writes this file.
4. `node docs/research/_component-survey/render-cards.mjs` — writes `component-survey-cards.md` with per-component prop/a11y/design aggregation.

To extend with a new system, add it to a Phase-1 / Phase-1b workflow script and re-run from step 1. To add a synonym or change a doc/app tag, edit `consolidate.mjs` and re-run from step 2 (no re-fetching).

## Dogfood-the-docs lens

Teseor is the only CSS the docs site (and any app built on Teseor) is allowed to ship. So the survey ranks each component on two axes:

- **System frequency** — how many of the 50 surveyed systems ship a recognizable equivalent.
- **Surface relevance** — whether the component is needed for *prose / docs content* (`doc`), *application interaction* (`app`), or *both*.

A component that scores high on prose-content + missing from Teseor is a blocker for the docs site dogfood and outranks pure-app primitives at the same frequency.

## Priority buckets

Buckets are not a commitment to ship in this order — they're where each component sits *before* user review. Names are placeholders; final naming decisions happen in synthesis.

| Bucket | Definition | Count |
| --- | --- | --- |
| `covered` | Already shipped by Teseor (alias-aware) | 10 |
| `p1-docs-and-app` | Doc-relevant or dual-use, present in ≥6 systems, missing from Teseor — blocks dogfooded docs site | 36 |
| `p1-app-core` | App-only, present in ≥15 systems, missing — core app primitives | 12 |
| `p2-docs-niche` | Doc-relevant but lower frequency — still doc-blocking | 21 |
| `p2-app-common` | App-only, mid frequency | 22 |
| `p2-both-common` | Dual-use, mid frequency | 4 |
| `p3-specialized` | Tail (low frequency or very specific scope) | 53 |

## Ranked backlog

### Already covered by Teseor (10)

These are alias-matched against Teseor's current spec set. Naming reset still applies — some shipped names may not match the consensus pick (see § Rename candidates).

| Consensus | Sys | Cat | Lens | Teseor | Aliases (sample) |
| --- | --- | --- | --- | --- | --- |
| **Button** | 28 | primitive | both | shipped | ActionIcon, Button, Button (button + submit/reset/button-typed inputs), Buttons |
| **Tabs** | 23 | composite | both | shipped-as-tablist | TabItem, TabList / Tab, Tabs, Tabs (UI Blocks) |
| **Tooltip** | 21 | composite | app | shipped | Tooltip, Tooltip (Popover trigger), Tooltips |
| **Dialog** | 18 | composite | both | shipped-as-modal | Dialog, Dialog (modal), Modal dialog |
| **Pagination** | 17 | composite | both | shipped | Pagination, Pagination (App) |
| **Code** | 14 | primitive | doc | shipped | Code, Code (code, kbd, pre), Code (code, kbd, samp, pre), Code (code, kbd, var, samp, pre) |
| **Modal** | 10 | composite | both | shipped | Modal, Modal (dialog) |
| **Stack** | 9 | layout | both | shipped | Flex, Stack, Wrap |
| **CodeBlock** | 7 | composite | doc | shipped | Code Block, Code Block (diff), Code Block (errors & warnings), Code Block (focus) |
| **Group** | 6 | layout | both | shipped-as-cluster | Group, Group (input group), Inline, group |

### P1 — Doc-blocking or dual-use (36)

These are the dogfood-the-docs critical path. Each one is either a prose primitive (heading, paragraph, list, divider, code, blockquote) or a dual-use surface used in both docs and app shells. Missing one of these means the docs site needs custom CSS to ship.

| Consensus | Sys | Cat | Lens | Teseor | Aliases (sample) |
| --- | --- | --- | --- | --- | --- |
| **Table** | 24 | primitive | doc | — | Table, Tables (UI Blocks), prose table, prose tbody |
| **Link** | 22 | primitive | doc | — | Link, Link (a), NavLink, Skip Nav |
| **ProgressBar** | 21 | primitive | both | — | Progress, Progress - Linear, Progress Bar, Progress Bars |
| **Badge** | 18 | primitive | both | — | Badge, Badges (UI Blocks), Chip, Pill |
| **Card** | 18 | composite | both | — | Card, Card (article), Card / CardView, CardGroup |
| **List** | 18 | primitive | doc | — | List, List (ul, ol, li), OrderedList, UnorderedList |
| **Alert** | 17 | primitive | both | — | Alert, Alerts, Banner, Banners |
| **Accordion** | 16 | composite | both | — | Accordion, Accordion (details/summary), AccordionGroup, Expandable |
| **Breadcrumbs** | 16 | composite | both | — | Breadcrumb, Breadcrumbs |
| **Divider** | 16 | primitive | doc | — | Divider, Dividers, Separator |
| **Heading** | 16 | primitive | doc | — | Heading, Headings (h1-h6), Title, prose h1 |
| **Text** | 16 | primitive | doc | — | Text, Typography, Typography (Label/Paragraph/Display/Mono), Typography (h1-h6, p, blockquote, address, abbr, mark) |
| **Image** | 15 | primitive | doc | — | Image, Image (Lazy Loading), Image (MDX), Image (img) |
| **Collapsible** | 13 | composite | both | — | Collapse, Collapsible, Disclosure |
| **Blockquote** | 11 | primitive | doc | — | Blockquote, Blockquote (+ footer attribution), Blockquote / cite, prose blockquote |
| **Grid** | 11 | layout | both | — | FlexGrid, Grid, SimpleGrid |
| **Steps** | 10 | composite | both | — | Step, Stepper, Steps |
| **Icon** | 9 | primitive | both | — | Icon, Icons |
| **Details** | 8 | composite | doc | — | Details, Details / summary |
| **Paragraph** | 8 | primitive | doc | — | Paragraph, Paragraph (p), prose lead, prose p |
| **Tag** | 8 | primitive | both | — | Tag, Tag / InteractionTag |
| **Carousel** | 7 | composite | both | — | Carousel |
| **Container** | 7 | layout | both | — | Container, Container (danger), Container (details), Container (info) |
| **HorizontalRule** | 7 | primitive | doc | — | Horizontal rule (hr), HorizontalRule, prose hr, prose-hr |
| **Kbd** | 7 | primitive | doc | — | Kbd, Keyboard key, prose kbd, prose-kbd |
| **Rating** | 7 | primitive | both | — | Rating, Rating / RatingDisplay / RatingItem, rating |
| **ScrollArea** | 7 | composite | both | — | Scroll Area, ScrollArea, Scrollable |
| **SearchField** | 7 | primitive | both | — | Search, Search Field, SearchField, search |
| **Section** | 7 | layout | doc | — | Em, Prose, Section, prose |
| **Sidebar** | 7 | composite | both | — | Navbar, Navbars, SideNavigation, Sidebar |
| **DescriptionList** | 6 | primitive | doc | — | Definition list (dl, dt, dd), Description Lists, Description list, prose dd |
| **Figure** | 6 | layout | doc | — | Figure, Figure / figcaption, prose figcaption, prose figure |
| **Footer** | 6 | layout | both | — | Footer, Footers |
| **Header** | 6 | layout | both | — | Header, Headers (Marketing Elements), Page header |
| **Nav** | 6 | layout | both | — | Nav |
| **Timeline** | 6 | composite | doc | — | Timeline |

### P1 — Core app primitives (12)

Ubiquitous across opinionated libs. Required to claim "build an app with zero custom CSS." Order within this bucket follows system-frequency.

| Consensus | Sys | Cat | Lens | Teseor | Aliases (sample) |
| --- | --- | --- | --- | --- | --- |
| **Select** | 28 | primitive | app | — | Native Select, NativeSelect, Select, Select (Native) |
| **Checkbox** | 25 | primitive | app | — | Checkbox, Checkbox / radio, checkbox |
| **Input** | 25 | primitive | app | — | Input, Input (text family), Text Field, Text Input |
| **DropdownMenu** | 24 | composite | app | — | ActionMenu, Dropdown, Dropdown Menu, Dropdown menu |
| **RadioGroup** | 23 | composite | app | — | Radio, Radio / RadioGroup, Radio Group, Radio Groups |
| **Textarea** | 22 | primitive | app | — | Text Area, Text area, TextArea, Textarea |
| **Switch** | 21 | primitive | app | — | Switch, Toggle, Toggle Tip, Toggles |
| **Slider** | 20 | primitive | app | — | Range, Range slider, RangeSlider, Slider |
| **Avatar** | 19 | primitive | app | — | Avatar, Avatars (UI Blocks) |
| **Form** | 18 | composite | app | — | Form, form |
| **Popover** | 18 | composite | app | — | Floating Panel, Popover, Popovers |
| **Toast** | 15 | primitive | app | — | Snackbar, Sonner, Toast, Toast / Toaster / useToastController |

### P2 — Lower-frequency doc components (21)

Prose components that appear in fewer systems but still matter for the docs site (Kbd, Mark, Figure, etc.).

| Consensus | Sys | Cat | Lens | Teseor | Aliases (sample) |
| --- | --- | --- | --- | --- | --- |
| **AspectRatio** | 5 | layout | doc | — | Aspect Ratio, AspectRatio |
| **Callout** | 5 | composite | doc | — | Admonition (danger), Admonition (info), Admonition (note), Admonition (tip) |
| **Article** | 4 | layout | doc | — | Article, Article (card) |
| **Aside** | 4 | layout | doc | — | Aside, Aside (callout) |
| **Mark** | 4 | primitive | doc | — | Highlight, Mark, prose mark |
| **ListItem** | 3 | primitive | doc | — | Item, ListItem |
| **Marquee** | 3 | primitive | doc | — | Marquee |
| **Strong** | 3 | primitive | doc | — | Strong / em, Strong / em / b / i / mark / small / sub / sup, prose em, prose strong |
| **Head** | 2 | primitive | doc | — | Head |
| **Main** | 2 | layout | doc | — | Main |
| **Math** | 2 | primitive | doc | — | Math (KaTeX), Math Equations |
| **Mermaid** | 2 | complex | doc | — | Mermaid, Mermaid Diagram |
| **Small** | 2 | primitive | doc | — | Small / mark / sup, Small / sub / sup |
| **TableOfContents** | 2 | composite | doc | — | Table of Contents, TableOfContents |
| **Video** | 2 | primitive | doc | — | Youtube, prose video, prose-video |
| **Frontmatter** | 1 | primitive | doc | — | Frontmatter |
| **Hero** | 1 | layout | doc | — | Hero |
| **LinkCard** | 1 | composite | doc | — | LinkCard |
| **MediaObject** | 1 | layout | doc | — | Media Objects |
| **Update** | 1 | composite | doc | — | Update |
| **Watermark** | 1 | primitive | doc | — | Watermark |

### P2 — Mid-frequency app components (22)

| Consensus | Sys | Cat | Lens | Teseor | Aliases (sample) |
| --- | --- | --- | --- | --- | --- |
| **ColorInput** | 14 | composite | app | — | Color, Color Picker, Color input, Color picker |
| **Combobox** | 14 | composite | app | — | Combo Box, ComboBox, Combobox, PillsInput |
| **DatePicker** | 14 | complex | app | — | Date / time, Date Field, Date Input, Date Picker |
| **FileInput** | 13 | composite | app | — | Drop zone, DropZone, File Input, File Upload |
| **Label** | 13 | primitive | app | — | Label, Label / fieldset / legend, Label / legend / fieldset |
| **Calendar** | 12 | complex | app | — | Calendar, Calendars, Month, Months |
| **Drawer** | 12 | composite | app | — | Drawer, Drawers, Sheet |
| **Spinner** | 12 | primitive | app | — | Loading, Spinner, Spinners |
| **NumberInput** | 11 | composite | app | — | FormatNumber, Number Field, Number Input, NumberField |
| **Skeleton** | 11 | primitive | app | — | Skeleton |
| **Tree** | 11 | complex | app | — | Tree, Tree View, Tree.File, Tree.Folder |
| **Autocomplete** | 10 | composite | app | — | AutoComplete, Autocomplete, autocomplete |
| **FormControl** | 10 | composite | app | — | Field, Form control, FormControl |
| **ListBox** | 10 | composite | app | — | Grid Lists, GridList, List Box, ListBox |
| **Fieldset** | 9 | composite | app | — | Fieldset |
| **Pin** | 9 | composite | app | — | Input OTP, OTP Field, One-Time Password Field, Password Input |
| **ButtonGroup** | 8 | composite | app | — | Button Group, Button Groups (UI Blocks), Button group, ButtonGroup |
| **EmptyState** | 8 | composite | app | — | Empty, Empty State, Empty States, Empty state |
| **ToggleGroup** | 8 | composite | app | — | Tag Group, Tag group, TagGroup, Toggle Button Group |
| **Toolbar** | 8 | composite | app | — | Action Bar, ActionBar, Toolbar |
| **DataTable** | 7 | complex | app | — | Data List, Data Table, Data table, DataGrid |
| **TimeInput** | 7 | composite | app | — | Time Field, TimeField, TimePicker, TimePicker (compat) |

### P2 — Mid-frequency dual-use (4)

| Consensus | Sys | Cat | Lens | Teseor | Aliases (sample) |
| --- | --- | --- | --- | --- | --- |
| **Box** | 5 | layout | both | — | Box |
| **Notification** | 5 | primitive | both | — | Notification, Notifications |
| **Bleed** | 4 | layout | both | — | Bleed |
| **VisuallyHidden** | 4 | primitive | both | — | Visually Hidden, Visually hidden, VisuallyHidden |

### P3 — Specialized or tail-frequency (53)

Lower system count or very narrow scope (color subsystems, niche industry components like QRCode, SignaturePad). Surface only when a concrete need pulls them in.

| Consensus | Sys | Cat | Lens | Teseor | Aliases (sample) |
| --- | --- | --- | --- | --- | --- |
| **AlertDialog** | 5 | composite | app | — | Alert Dialog, AlertDialog |
| **CheckboxGroup** | 5 | composite | app | — | Checkbox Group, CheckboxGroup |
| **ColorSwatch** | 5 | primitive | app | — | Color Area, Color Field, Color Slider, Color Swatch |
| **HoverCard** | 5 | composite | app | — | Hover Card, HoverCard |
| **ProgressCircle** | 5 | primitive | app | — | Progress - Circular, Progress Circle, ProgressCircle, RingProgress |
| **Resizable** | 5 | composite | app | — | Resizable, Splitter |
| **SegmentedControl** | 5 | composite | app | — | Segmented, Segmented Control, SegmentedControl |
| **CloseButton** | 4 | primitive | app | — | Close Button, Close button, CloseButton |
| **ContextMenu** | 4 | composite | app | — | Context Menu, ContextMenu |
| **InputGroup** | 4 | composite | app | — | Input Group, Input Groups, Input group |
| **Menubar** | 4 | composite | app | — | Menubar |
| **Meter** | 4 | primitive | app | — | Meter |
| **Page** | 4 | layout | app | — | Page, PageHeader |
| **Portal** | 4 | primitive | app | — | Portal |
| **Stat** | 4 | composite | app | — | Stat, Statistic, Stats (Application) |
| **Tile** | 4 | composite | app | — | Tile |
| **Anchor** | 3 | primitive | both | — | Anchor |
| **CommandPalette** | 3 | primitive | app | — | Command, Command Palettes, Command.Dialog, Command.Empty |
| **DateRangePicker** | 3 | complex | app | — | Date Range Picker, DateRangePicker, Range Calendar, RangeCalendar |
| **LoadingOverlay** | 3 | primitive | app | — | LoadingOverlay, Overlay, loadingOverlay |
| **NavigationMenu** | 3 | composite | both | — | Navigation Menu |
| **QRCode** | 3 | primitive | app | — | QR Code, QRCode |
| **RichTextEditor** | 3 | complex | both | — | Editor, LexicalComposer, Rich Text Editor |
| **TagInput** | 3 | composite | app | — | Tags Input, TagsInput |
| **Transfer** | 3 | complex | app | — | Transfer, Transfer List, transferlist |
| **Affix** | 2 | primitive | app | — | Affix |
| **Center** | 2 | layout | both | — | Center |
| **FieldArray** | 2 | complex | app | — | FieldArray, useFieldArray |
| **Frame** | 2 | layout | app | — | AppShell, Frame |
| **Indicator** | 2 | primitive | app | — | Indicator |
| **Layer** | 2 | layout | app | — | Layer |
| **Layout** | 2 | layout | app | — | Layout |
| **MaskedInput** | 2 | primitive | app | — | Mask, mask |
| **Masonry** | 2 | layout | both | — | Masonry |
| **MultiSelect** | 2 | composite | app | — | MultiSelect |
| **Onboarding** | 2 | complex | app | — | Tour |
| **Paper** | 2 | layout | both | — | Paper |
| **Space** | 2 | layout | both | — | Space |
| **TreeSelect** | 2 | complex | app | — | TreeSelect |
| **Backdrop** | 1 | primitive | app | — | Backdrop |
| **Cascader** | 1 | complex | app | — | Cascader |
| **ChoiceList** | 1 | composite | app | — | Choice list |
| **Controller** | 1 | composite | app | — | Controller |
| **ErrorBoundary** | 1 | primitive | app | — | ErrorBoundary |
| **ExceptionList** | 1 | composite | app | — | Exception list |
| **FormGroup** | 1 | layout | app | — | FormGroup |
| **FormProvider** | 1 | composite | app | — | FormProvider |
| **IndexTable** | 1 | complex | app | — | Index table |
| **Loader** | 1 | primitive | app | — | Burger, Loader |
| **Logo** | 1 | primitive | both | — | Logo |
| **MediaCard** | 1 | composite | both | — | Media card |
| **Picker** | 1 | composite | app | — | Picker |
| **SpeedDial** | 1 | composite | app | — | Speed Dial |

## Rename observations (held — do not act on without per-component sign-off)

Naming reset means *we can pick the best name*, but the user has locked the decision: **no batch rename commits**. The pairs below are recorded so each future component issue surfaces them in context. Decisions happen per-component during synthesis, not as a global rename sweep.

| Teseor today | Consensus name | Where the consensus comes from | Tension |
| --- | --- | --- | --- |
| `Modal` | `Dialog` | Radix, React Aria, Ark, Base UI, MUI, Mantine, Chakra, Ant, HeroUI, Polaris, Carbon, Atlassian, BaseWeb, Spectrum, Fluent, shadcn/ui, Catalyst, Tailwind UI, daisyUI use `Dialog` | `Dialog` is the WAI-ARIA pattern name; `Modal` is a CSS/visual descriptor. Bootstrap is the main holdout. |
| `Tablist` | `Tabs` | Every multi-tab system surveyed surfaces the composite as `Tabs` | `Tablist` is the WAI-ARIA inner-role. Teseor today exposes the composite under the inner-role name. |
| `Cluster` | mixed (`Group` / `Cluster` / `Inline`) | `Group` (Carbon, Polaris, Mantine, Ariakit), `Cluster` / `Inline` (Every-Layout, Open Props), `Stack` (Chakra horizontal flavour) | `Group` reads ambiguously next to form `Fieldset` / `RadioGroup`. `Cluster` is unambiguous but less common. No clear winner. |

## Per-system catalog (appendix)

Raw per-system component lists live in `.local/component-survey/raw-workflow-output.json`. Summary counts only here.

| Family | System | Components recorded |
| --- | --- | --- |
| headless-unstyled | Radix UI Primitives | 33 |
| headless-unstyled | Headless UI (React) | 16 |
| headless-unstyled | React Aria Components | 50 |
| headless-unstyled | Ark UI | 50 |
| headless-unstyled | Base UI | 37 |
| opinionated-react | MUI (Material UI) | 61 |
| opinionated-react | Chakra UI | 112 |
| opinionated-react | Mantine | 112 |
| opinionated-react | Ant Design | 71 |
| opinionated-react | Bootstrap | 34 |
| opinionated-react | HeroUI | 72 |
| brand-enterprise-a | Polaris (Shopify) | 67 |
| brand-enterprise-a | Primer (GitHub) | 59 |
| brand-enterprise-a | Carbon (IBM) | 97 |
| brand-enterprise-a | Atlassian Design System | 69 |
| brand-enterprise-b | BaseWeb (Uber) | 71 |
| brand-enterprise-b | React Spectrum (Adobe) | 85 |
| brand-enterprise-b | Fluent UI React (v9 / Fluent 2) | 60 |
| tailwind-ecosystem | shadcn/ui | 59 |
| tailwind-ecosystem | Catalyst (Tailwind Labs) | 23 |
| tailwind-ecosystem | Tailwind Plus UI Blocks | 80 |
| tailwind-ecosystem | daisyUI | 65 |
| css-only-classless | Pico.css | 30 |
| css-only-classless | Water.css | 19 |
| css-only-classless | new.css | 18 |
| css-only-classless | MVP.css | 24 |
| css-only-classless | Simple.css | 25 |
| css-only-classless | Sakura.css | 16 |
| css-only-classless | awsm.css | 32 |
| css-only-classless | Tufte CSS | 20 |
| form-specific | FormKit | 41 |
| form-specific | React Hook Form | 11 |
| form-specific | Formik | 11 |
| form-specific | react-jsonschema-form (RJSF) | 38 |
| form-specific | TanStack Form | 9 |
| niche-surfaces | Sonner | 10 |
| niche-surfaces | react-hot-toast | 10 |
| niche-surfaces | Radix Toast | 7 |
| niche-surfaces | cmdk | 10 |
| niche-surfaces | Tiptap | 55 |
| niche-surfaces | Lexical | 28 |
| niche-surfaces | React Day Picker | 30 |
| niche-surfaces | AG Grid (React) | 18 |
| niche-surfaces | TanStack Table | 22 |
| docs-platforms-a | Docusaurus | 16 |
| docs-platforms-a | Nextra | 17 |
| docs-platforms-a | VitePress | 28 |
| docs-platforms-b | Mintlify | 38 |
| docs-platforms-b | Astro Starlight | 12 |
| docs-platforms-b | Tailwind Typography (prose plugin) | 72 |

## Notes on the data

- **Naming clustering is mechanical, not editorial.** When a system has `IconButton` and `Button` as separate exports, both are folded into `Button` (since `IconButton` is a Button variant in most systems). This may over-collapse for systems that treat them as distinct (Carbon, Polaris). When a rename or split would change the count, the synthesis section calls it out.
- **`category` is the modal value across systems.** Radix may call `Switch` a primitive while Mantine wraps it in a composite. The matrix reports the most common categorization.
- **Form-library entries are noisier.** React Hook Form, Formik, TanStack Form ship hooks and `Controller`-style wrappers, not visual components. They are surveyed for *vocabulary* (Field, FieldArray, FormProvider, ErrorMessage) — Teseor will adopt the patterns that apply to its `Form` and `FormField` composites.
- **CSS-only systems surfaced raw HTML elements.** `<table>`, `<details>`, `<blockquote>`, `<kbd>`, `<dl>` etc. show up as "components" because that's the entire surface of a classless system. They feed the dogfood-docs ranking directly.
- **Niche surfaces are present but unranked together.** Editor shells (Tiptap, Lexical), data grids (AG Grid, TanStack Table), and command palettes (cmdk) appear in the matrix at single-system frequency. The user picks whether Teseor commits to those areas before they enter any priority bucket.
