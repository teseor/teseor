# Naming consistency

Every component speaks the same vocabulary. `size`, `variant`, `intent` mean the same thing everywhere. A new component that wants a fifth variant adds it to the canonical list via PR — it doesn't invent a private vocabulary.

## The canonical vocabulary

Stored in `specs/_vocabulary.yaml`. Single source of truth for the lists below.

```yaml
# Component names (one canonical noun each, no aliases)
components: [Button, Anchor, Input, Select, Textarea, Checkbox, Radio, Switch,
             Badge, Avatar, Icon, Kbd, Divider, Dot, Code,
             Card, Alert, Banner, Skeleton, Progress,
             Tabs, Segmented, Breadcrumb, Pagination, Menu,
             Tooltip, Popover, Modal, Drawer, Toast, Backdrop,
             Combobox, DatePicker, Slider, Stepper, Table, Tree, Accordion,
             Stack, Cluster, Center, Sidebar]

# Standard prop names (use the same name everywhere they apply)
props: [size, variant, intent, disabled, loading, error, density, layout, align]

# Variant values (visual hierarchy)
variants: [solid, outline, ghost, link]

# Intent values (semantic color role)
intents: [neutral, primary, danger, success, warning, info]

# Sizes — t-shirt for component props
sizes: [sm, md, lg]

# Size mapping (component → token suffix)
sizeMap:
  sm: 2   # --t-space-2, --t-text-sm
  md: 4   # --t-space-4, --t-text-base
  lg: 6   # --t-space-6, --t-text-lg

# State names (aligned with ARIA where ARIA defines a name)
states: [disabled, loading, error, success, selected, expanded, pressed, checked]

# BEM element-parts (descendants of the root class)
parts: [__header, __body, __footer, __title, __description,
        __icon, __label, __close, __trigger, __panel,
        __list, __item]

# Event verbs (spec form; generators emit framework-native)
events: [click, submit, dismiss, change, select, open, close, focus, blur]
```

Adding a new entry to any list is a vocabulary PR — small, reviewed, and documented in the changeset. The vocabulary file is the unique escape hatch; private vocabulary in component specs is rejected.

## Rules

**1. One canonical noun.** `Button` not `Btn`, `Modal` not `Dialog`, `Drawer` not `Sheet`. Synonyms are forbidden — a fork in naming forks the docs, the issue tracker, and consumer code.

**2. Same prop name everywhere it applies.** Loading state on Button is `loading: boolean`; loading state on Input is also `loading: boolean`. Not `isLoading`, not `pending`, not `busy`. Validator rejects non-canonical prop names.

**3. Variants and intents from the canonical list only.** A component proposing a fifth variant submits a vocabulary PR first; otherwise validator fails.

**4. Sizes — t-shirt for props, numeric for tokens. Never mix.** Component props: `size="sm"`. Token suffixes: `--t-space-4`. The `sizeMap` translates between them inside codegen; consumer code never types numbers as size values, and component CSS never uses t-shirt-suffixed tokens.

**5. State names align with ARIA where ARIA has a name.** `expanded`, `pressed`, `checked` are ARIA terms; we reuse them. `loading`, `error`, `success` are common DS terms; we use the common one. No `isExpanded`, no `aria-expanded`-redundant `expanded={true}` on the prop side — the wrapper translates spec state to ARIA.

**6. BEM element-parts from the canonical list.** A component with a `__header` part shares the same word as every other component with a header. Adding `__sidebar` requires a vocabulary PR. Stylelint catches non-canonical `__foo` parts via a custom rule keyed off `_vocabulary.yaml`.

**7. Events use verbs in spec form.** Spec says `events: [click, submit, dismiss]`. Generators translate per framework:

| Spec | React | Vue | Svelte | Angular | WebC |
| --- | --- | --- | --- | --- | --- |
| `click` | `onClick` | `@click` | `on:click` | `(click)` | `click` event |
| `submit` | `onSubmit` | `@submit` | `on:submit` | `(submit)` | `submit` event |
| `dismiss` | `onDismiss` | `@dismiss` | `on:dismiss` | `(dismiss)` | `dismiss` event |

Same verb in spec = same conceptual event across all wrappers. Consumers learn the verb once.

## Enforcement

`validate-spec.ts` runs on every PR (part of the `lint` gate). It loads `specs/_vocabulary.yaml` and checks each spec's:

- `name:` matches a canonical noun (or adds one in the same PR via vocabulary file diff)
- `variants:` ⊆ canonical variants
- `intents:` ⊆ canonical intents
- `sizes:` ⊆ canonical sizes
- `props.*.name:` ∈ canonical props OR is a component-specific prop (must be declared as such)
- `events:` ⊆ canonical events
- All `__*` classes in the CSS file match canonical parts

Validation failure includes a Levenshtein-distance suggestion:

```text
specs/popover.yaml:8  intent 'destructive' not in vocabulary.
  Did you mean 'danger'?
```

This catches drift the moment a contributor (or Claude) coins a new word. The vocabulary file becomes the ledger; spec specs become consistent by construction.

## Adding a new vocabulary term

1. PR opens with: edit to `specs/_vocabulary.yaml` + edit to one or more specs that use the new term.
2. PR description justifies why the existing vocabulary doesn't fit.
3. Reviewer checks: is this a genuinely new concept, or could an existing word serve?
4. Merge accepts the term as canonical.

This is the only path. There is no "experimental" vocabulary slot.

## Logical, not physical

Every name that refers to position uses **inline-start / inline-end / block-start / block-end** semantics, not **left / right / top / bottom**. Buttons have `iconStart` and `iconEnd`. Data-attributes use `data-position="start"` and `data-position="end"`. CSS uses `padding-inline`, `block-size`, `border-inline-start`.

The reason is RTL: in right-to-left writing modes, `start` is on the right and `end` is on the left. A prop named `iconLeft` either lies about its position in RTL or forces consumers to swap props at the call site. Logical naming keeps the prop honest and removes the per-locale conditional.

`scripts/check-logical-naming.js` (wired into pre-commit and CI) rejects:

- YAML prop keys ending in `Left|Right|Top|Bottom` (e.g. `iconLeft`, `marginRight`).
- `data-position="left"` or `data-position="right"` string literals in generator scripts.

Stylelint's `property-disallowed-list` in `.stylelintrc.cjs` rejects the physical CSS spacing properties (`margin-*`, `padding-*`).

Icon names (`arrow-left`, `chevron-right`) are exempt — they describe the glyph itself, not a position in a layout.

## Sources

- ARIA 1.2 (W3C Recommendation) — state-name reuse
- `codegen-pipeline.md` § "Spec validation" (validator wiring)
- `three-tier-tokens.md` § "Token surface" (numeric token scale)
