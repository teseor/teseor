# Codegen pipeline

One spec per component. Many outputs. CI fails if the outputs drift from the spec.

## Inputs

- **`specs/<name>.yaml`** — per-component spec (see ADR-0002).
- **`packages/css/src/components/<name>/<name>.css`** — the handwritten component CSS. Codegen reads it to verify that every `--t-<name>-*` token listed in the spec is actually declared, and vice versa.

## Spec shape

```yaml
name: button
description: A trigger that performs an action when activated.
kind: atomic           # atomic | composite
dependencies: []       # ["icon"] for composites
element: button        # default semantic tag
rootClass: t-button
file: components/button/button.css

variants:
  solid:   { description: Filled background with intent color. }
  outline: { description: Transparent background, intent-colored border. }
  ghost:   { description: Transparent background, no border. }
  link:    { description: Renders as text with an underline. }

intents:
  primary: { description: Most important action on the surface., tokens: { bg: --t-accent,  fg: --t-on-accent } }
  neutral: { description: Default action; non-emphasized.,        tokens: { bg: --t-surface, fg: --t-on-surface } }
  success: { description: Confirms a positive outcome.,           tokens: { bg: --t-success, fg: --t-on-success } }
  warning: { description: Needs attention but isn't destructive., tokens: { bg: --t-warning, fg: --t-on-warning } }
  danger:  { description: Destructive or irreversible action.,    tokens: { bg: --t-danger,  fg: --t-on-danger  } }

sizes:
  sm: { description: Compact density., tokens: { height: --t-row-2, pad-x: --t-space-3 } }
  md: { description: Default size.,    tokens: { height: --t-row-3, pad-x: --t-space-4 } }
  lg: { description: Emphatic CTA.,    tokens: { height: --t-row-4, pad-x: --t-space-5 } }

props:
  loading:
    type: boolean
    default: false
    responsive: false
    description: Shows a spinner in place of the label and disables interaction.
  disabled:
    type: boolean
    default: false
    responsive: false
    description: Disables interaction; mapped to native `disabled` on `button`, `aria-disabled="true"` otherwise.

tokens:                 # public token contract (--t-button-*)
  height: { fallback: --t-row,       desc: Control height. }
  bg:     { fallback: --t-accent,    desc: Background fill. }
  fg:     { fallback: --t-on-accent, desc: Foreground color (label and icon). }

private: [--_h, --_bg, --_pad-x]   # documented for reference, not API

a11y:
  role: button
  keyboard:
    Enter: activate
    Space: activate

examples:
  - id: solid-primary
    props: { variant: solid, intent: primary }
  - id: loading
    props: { loading: true }

motion:
  transitions: [background-color, transform]
  # If `enters:` is declared, `exits:` is required (in/out symmetry; see rules/motion.md rule 5).
  # enters: [open]
  # exits:  [close]
```

The `motion:` field is required at the atomic milestone. See `rules/motion.md` for the full rule set.

### Maps, not lists

`variants`, `intents`, and `sizes` are **maps** keyed on the value name, not bare lists. Every key carries a required `description:` field. Intents and sizes also carry a `tokens:` map binding the value to the semantic tokens the CSS layer reads. `gen-docs` surfaces the descriptions directly on the docs page; `gen-contract` ignores them.

The same `description:` requirement applies to every entry under `props:`. `validate-spec.ts` rejects a spec where any `prop`, `variant`, or `intent` is missing a `description:`. The rule exists because the docs page (`gen-docs`) is generated from these descriptions — leaving one blank leaves a hole in the public surface.

**Reserved fields (designed at later milestones, not yet usable):**

| Field | Purpose | Designed at |
| --- | --- | --- |
| `constraints:` | Mutex / forbidden prop combinations (e.g. `variant: link` forbids `intent: danger`) | v0.2 (Button) |
| `guidance:` | Docs-page content: `when`, `whenNot`, `variantChoice`, `contentRules`, `commonMistakes` — drives sections 2/3/6/12 of `docs-site.md` | v0.2 (Button) |
| `props[*].responsive: true` | Marks a prop as responsive (emits data-attribute breakpoint variants); valid on visual props only, rejected on `variant`/`intent` | v0.2 (Button) |
| `behavior:` + `primitives:` | Component behavior tier and required primitives (focus-trap, portal, …) | v0.3 (overlays) |
| `stability:` | `alpha` / `beta` / `stable` / `deprecated`; surfaces as badge in docs, JSDoc `@experimental`/`@deprecated`, and `teseor-ast.json` | v0.3 |
| `parts:` | Sub-components in the same family (Accordion.Root / .Item / .Trigger / .Panel) | v0.4 (surfaces) |

The schema is frozen for v0.1 (atomic-only components). It re-opens at each milestone above to add the relevant slot, then refreezes. `validate-spec.ts` rejects unknown fields until they're added.

### `constraints:` shape (v0.2 design)

Declarative `when` / `forbid` pairs. Each entry pairs a prop-value condition with the prop values that may not be set alongside it.

```yaml
constraints:
  - when:   { variant: link }
    forbid: { intent: [danger, warning] }
    reason: "Link variant is text-colored; intent fill has no surface to apply to."
  - when:   { loading: true }
    forbid: { disabled: true }
    reason: "Loading already disables interaction; redundant."
```

- `when:` is a map of `<prop>: <value>` keys; all must match for the constraint to fire.
- `forbid:` is a map of `<prop>: <value-or-list>` keys; the listed values are rejected when `when:` matches.
- `reason:` is required prose; surfaces in the validator error and on the component's docs page.

`validate-spec.ts` runs constraints against every entry in `spec.examples:` (rejecting illegal combinations at spec time) and `gen-contract.ts` emits TypeScript discriminated unions where possible so the IDE rejects the combination at consumer call sites. Runtime check in dev builds emits a `console.warn` matching the `reason:`.

## Behavior tiers

CSS handles state for `:hover/:focus-visible/:checked/[aria-expanded]/:has()`. It does not handle focus traps, escape-key dismissal, type-ahead in selects, roving tabindex, portal rendering, or arrow-key navigation across siblings. Components fall into three tiers:

| Tier | Examples | Behavior source | Codegen scope |
| --- | --- | --- | --- |
| **atomic** | Button, Badge, Input, Checkbox, Card | Native HTML + CSS state | Codegen emits the whole wrapper |
| **primitive** | Modal, Drawer, Popover, Tooltip | `@teseor/primitives` (focus-trap, portal, dismissible, escape-stack) | Codegen emits styling + ARIA wrapper; template imports primitives |
| **stateful** | Combobox, Tabs, Accordion, Menu, Select | Per-framework hand-authored behavior on top of primitives | Codegen emits the styling shell; behavior file is hand-authored alongside |

Per spec: `behavior: none | primitive | stateful`. Atomic components have `behavior: none` (the default for v0.1). The `@teseor/primitives` package occupies the `primitives` layer slot reserved in `architecture/layer-order.md` and lands in v0.4 (before the first overlay components in v0.5).

**Hand-authored behavior files** live at `packages/<framework>/src/behavior/<name>.tsx` (or `.vue`, `.svelte`, …). They do NOT carry the `AUTOGENERATED` banner — the lint rule that blocks edits to generated files exempts this path. The generated styling shell (`packages/<framework>/src/<name>.tsx`) imports from the behavior file when `behavior !== none`.

## Composition: parts, dependencies, primitives

Three distinct relationships, three different mechanisms:

**Parts** — sub-components within the *same family*, sharing state. Accordion is the canonical example: `Accordion.Root` owns the open/single-mode state, `Accordion.Item` opens/closes, `Accordion.Trigger` is the header button, `Accordion.Panel` is the disclosed content. One spec file declares all parts:

```yaml
# Designed at v0.4, sketch only
name: accordion
kind: composite
behavior: stateful
parts:
  root:    { rootClass: t-accordion,            props: { multiple: { type: boolean, default: false } } }
  item:    { rootClass: t-accordion__item,      props: { defaultOpen: { type: boolean, default: false } } }
  trigger: { rootClass: t-accordion__trigger,   a11y: { role: button } }
  panel:   { rootClass: t-accordion__panel,     a11y: { role: region } }
```

Codegen emits one wrapper module with sub-components attached: `Accordion.Item`, `Accordion.Trigger`, `Accordion.Panel`. One CSS file with the family's BEM classes.

**Dependencies** — independent components composed at the wrapper level. A Button with `dependencies: [icon]` means the generated wrapper imports `Icon` and renders one when `iconLeft`/`iconRight` props are passed. The Icon has its own spec, its own class, its own lifecycle. The dependency is a declared import, not a shared state.

**Primitives** — framework-agnostic behavior utilities from `@teseor/primitives`. `primitives: [portal, focus-trap]` means the generated wrapper composes these utilities. Primitives have no spec, no class — they're pure behavior modules.

| Relationship | What's shared | Spec field |
| --- | --- | --- |
| Parts | State + spec file + CSS file | `parts:` |
| Dependencies | Nothing — separate components, just imported | `dependencies:` |
| Primitives | Behavior utility, no UI | `primitives:` |

## Outputs

| Generator | Output | Path |
| --- | --- | --- |
| `gen-react.ts` | React TSX | `packages/react/src/Button.tsx` |
| `gen-vue.ts` | Vue SFC | `packages/vue/src/Button.vue` |
| `gen-svelte.ts` | Svelte | `packages/svelte/src/Button.svelte` |
| `gen-angular.ts` | Angular | `packages/angular/src/button.component.ts` |
| `gen-webc.ts` | LitElement web-component | `packages/webc/src/t-button.ts` |
| `gen-contract.ts` | TypeScript types | `packages/contract/src/Button.ts` |
| `gen-docs.ts` | Eleventy + Nunjucks input data | `apps/docs/src/components/button/` |
| `gen-tests.ts` | Playwright spec scaffold | `tests/<name>/<example>.spec.ts` |
| `gen-ast.ts` | Structured JSON of the whole DS (every component, every public token, every variant) | `apps/docs/src/_data/teseor-ast.json`, also republished as `packages/contract/dist/ast.json` |


## Invocation

```
pnpm gen                       # regenerate all wrappers, docs, types, tests
pnpm gen --component=button    # one component
pnpm gen --target=react        # one wrapper across all components
pnpm build:css                 # PostCSS pipeline → packages/css/dist/teseor.css
```

Scripts live in `scripts/codegen/` and are plain TypeScript run with `tsx`. The CSS build pipeline lives at `scripts/build-css.ts` and runs PostCSS with the plugin set defined in ADR-0003.

## Workspace tooling

- **pnpm workspaces** as the substrate. Single lockfile, `workspace:*` symlinks, topological runs (`pnpm -r build`), filtered runs (`pnpm --filter "@teseor/react" build`), affected runs (`pnpm --filter "...[origin/main]"`).
- **No nx until a watch-signal fires.** nx runs on top of pnpm workspaces (additive, not replacement) so adopting it later is a 2–3 day refactor. Signals that justify the switch: full-workspace build exceeds 2 minutes, package count crosses 10 with non-trivial cross-deps, CI rebuild cost becomes painful, or task pipelines outgrow what pnpm scripts can express cleanly.
- **Git hooks via lefthook.** Single `lefthook.yml` at the repo root. Parallel pre-commit on staged files (Biome for TS/JS, Stylelint for CSS). Sequential pre-push runs `pnpm lint && pnpm typecheck` (no tests on push — CI catches them). Replaces Husky + lint-staged with one tool and one config.
- **Node 24 LTS (Krypton)** is the floor for the toolchain. **pnpm 11.1.3** pinned via `packageManager` in root `package.json`, Corepack-enforced.

## Two pipelines, distinct concerns

| Pipeline | Inputs | Outputs | Committed? |
| --- | --- | --- | --- |
| **Codegen** (`pnpm gen`) | `specs/*.yaml` + handwritten CSS | React/Vue/Svelte/Angular/webc wrappers, contract TS, docs HTML, Playwright specs | Yes — reviewed in PRs |
| **CSS build** (`pnpm build:css`) | Handwritten CSS files | `dist/teseor.css` (full), `dist/<name>.css` (per-component), `dist/tokens.css` (standalone), each with sourcemap | No — `.gitignore`d; emitted to npm tarball only |

Codegen has a drift gate (`gen-drift`): `pnpm gen` then `git diff --exit-code`. The CSS build has no drift gate — there's no committed dist to diff against; publish-time build is authoritative.

## Published CSS entry-points

`@teseor/css` exports four shapes via the package's `exports` map:

| Specifier | File | Use case |
| --- | --- | --- |
| `@teseor/css` | `dist/teseor.css` | Full bundle — prototyping, "just include this one file" |
| `@teseor/css/<name>` | `dist/<name>.css` | One component, tree-shakable when only a few are used |
| `@teseor/css/tokens.css` | `dist/tokens.css` | Tokens alone — compose third-party themes, or use scales without components |
| `@teseor/css/utilities.css` | `dist/utilities.css` | Utilities only (spacing, display, animation, text, visibility) — no components, for sites that don't use Teseor components |

Per-component files each carry their inlined literal floor and render correctly without the full bundle (the acid test, `rules/component-shape.md`).

## Drift detection

The CI job `gen-drift`:
1. Checks out the PR.
2. Runs `pnpm gen`.
3. Runs `git diff --exit-code -- packages/ apps/docs/ tests/`.
4. Fails if anything changed.

A failed `gen-drift` means somebody edited a generated file by hand. The fix is "run `pnpm gen` locally, commit the result, and edit the spec next time."

## Spec validation

`scripts/codegen/validate-spec.ts` runs on every PR via the `lint` job. Checks:

- Spec parses against the YAML schema.
- Every token listed in `tokens:` is declared as `--t-<name>-<key>:` in the CSS file.
- Every `--t-<name>-*` declared in the CSS is listed in `tokens:`.
- `dependencies:` references existing components.
- `examples:` references valid combinations of `variants/intents/sizes`.
- `a11y.keyboard` keys are well-known names (Enter, Space, ArrowLeft, …).
- **Vocabulary check** — `name:`, `variants:`, `intents:`, `sizes:`, `props.*.name:`, `events:`, and `__*` class parts all belong to `specs/_vocabulary.yaml`. Non-canonical names fail with a Levenshtein-distance suggestion. See `rules/naming.md`.


