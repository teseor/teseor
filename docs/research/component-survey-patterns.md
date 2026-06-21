# Component survey — cross-component patterns

Derived from the 50-system component survey (`component-survey.md` /
`component-survey-cards.md`). Inputs: `.local/component-survey/consolidated.json`
(158 consensus components, 1025 system×component entries with `key_props`).
Extractor: `.local/component-survey/extract-patterns.mjs`.

This doc fixes the cross-cutting decisions once so every per-component issue
inherits them. Per-component issues defer to this table for prop names, state
naming, slot pattern, and which runtime mechanism (`@teseor/primitives` entry,
codegen template, or missing) wires the behavior.

Renames of existing Teseor exports are NOT decided here. Those land per
component, with explicit user sign-off per CLAUDE.md "ask before breaking
changes to public API."

---

## 1. Canonical prop vocabulary

### 1.1 Boolean state — never `is`-prefixed

Every state boolean uses the HTML attribute name. The non-prefixed form wins by
both component count and system count in every pair, and it lets the prop pass
through to the underlying element without a rename layer.

| Concept | Canon | Frequency | Loses to | Loser frequency |
| --- | --- | --- | --- | --- |
| Open/closed | `open` | 27c × 90s | `isOpen` | 7c × 15s |
| Default open | `defaultOpen` | 14c × 37s | `defaultIsOpen` | 0c |
| Disabled | `disabled` | 31c × 115s | `isDisabled` | 21c × 29s |
| Loading | `loading` | 11c × 15s | `isLoading` | 3c × 4s |
| Selected | `selected` | 13c × 17s | `isSelected` | 3c × 9s |
| Checked | `checked` | 5c × 32s | `isChecked` | 3c × 3s |
| Invalid | `invalid` | 12c × 23s | `isInvalid` | 5c × 7s |
| Required | `required` | 6c × 15s | `isRequired` | 7c × 8s |
| Read-only | `readOnly` | — | `isReadOnly` | 3c × 3s |

Rule: prefer the HTML attribute spelling. `required` is the only pair where the
`is` form leads on component count, but loses on system count and breaks the
"matches HTML" rule — drop the prefix anyway.

### 1.2 Controlled / uncontrolled trio

| Concept | Value trio | Open/close trio | Selection trio |
| --- | --- | --- | --- |
| Current | `value` (44c × 227s) | `open` (27c × 90s) | `selected` (13c × 17s) |
| Default | `defaultValue` (26c × 63s) | `defaultOpen` (14c × 37s) | `defaultSelected` (4c × 7s) |
| Change | `onChange` (40c × 155s) **or** `onValueChange` (26c × 65s) | `onOpenChange` (19c × 61s) | `onSelectionChange` |

`onChange` vs `onValueChange` is the only ambiguity. Rule: use `onChange` when
there is no native `onChange` on the underlying element; use `onValueChange`
when the underlying element fires its own `onChange` (Input, Textarea, Select)
to avoid the name collision. Radix-family adopts `onValueChange` everywhere for
consistency — we accept the small redundancy on collision-prone elements only.

### 1.3 Style scale

| Prop | Canon | Frequency | Notes |
| --- | --- | --- | --- |
| Size | `size` | 62c × 166s | Token-driven scale: `xs \| sm \| md \| lg \| xl`. No competing name. |
| Style switch | `variant` | 46c × 79s | Beats `appearance` (20c × 26s), `kind` (7c × 9s). Values are component-specific. |
| HTML type | `type` | 28c × 65s | Keep separate from `variant`. `type` carries HTML semantics (`button`, `submit`, `email`). `variant` carries visual style. |
| Color | `color` | 34c × 70s | Beats `colorScheme` (0). Token-driven semantic palette. |

### 1.4 Layout

| Prop | Canon | Frequency | Notes |
| --- | --- | --- | --- |
| Axis | `orientation` | 23c × 75s | `'horizontal' \| 'vertical'`. Universal. |
| Cross-axis align | `align` | 13c × 19s | Adopt where the component genuinely has axis-cross alignment (Popover, Tooltip, Menu). |

### 1.5 Form vocabulary

| Prop | Canon | Frequency | Notes |
| --- | --- | --- | --- |
| Form-control name | `name` | 30c × 72s | Passes through to the underlying form element. |
| Accessible label | `label` | 36c × 58s | Two-way: prop accepts a string; `<label>` element accepts children. |
| Placeholder | `placeholder` | 11c × 23s | Native HTML attribute on input-like elements. |
| Description / help | `description` | 11c × 17s | Beats `helperText` (3c × 3s). Renders as `aria-describedby` target. |
| Error message | (component-specific) | — | No canon emerges; tracked per-component (FormField etc.). |

### 1.6 Polymorphism — `asChild` adopted

Two patterns competed:

- `as` prop (24c × 34s) — Chakra/React Aria/MUI style. Polymorphic element via a
  prop: `<Button as={Link} />`. Heavy generic types; every prop intersects with
  the target element's props.
- `asChild` slot (21c × 22s) — Radix / shadcn / Base UI style. Render-as-child
  via a wrapper that hoists its child's tag and props: `<Button asChild><Link
  /></Button>`. Simple types; child controls its own props.

Decision: **`asChild`.** Reasons: (a) no generic-types contortion in the
codegen output, (b) class merging works without a `className` intersection, (c)
matches the Radix-derived primitives Teseor already follows (`@teseor/primitives`
uses Radix-style escape stack and modality semantics).

`as` is rejected. Components that need polymorphism use `asChild` + Slot. The
Slot codegen template is added when the first asChild-bearing component lands
(Divider, Wave 1).

---

## 2. Shared mechanisms — primitives map

Each row maps a recurring behavior to its runtime source. The "Status" column
distinguishes:

- **shipped primitive** — `@teseor/primitives` exposes a public hook/helper today
- **codegen pattern** — emitted into generated React/Vue wrappers, no runtime
  primitive needed
- **missing primitive** — recurring behavior with no Teseor implementation;
  needs a primitive issue before the consuming component can ship

| Mechanism | Used by | Source | Status |
| --- | --- | --- | --- |
| Escape-to-dismiss (stacked) | Dialog, Drawer, Modal, Popover, Tooltip, Menu, Select, Combobox, Toast, … (12 components, 32 systems) | `dismissable-layer/onEscapeKeyDown` | shipped |
| Outside-click-to-dismiss | (every overlay) | `dismissable-layer/onInteractOutside` | shipped |
| Focus trap | Dialog (13), Drawer (8), Modal (8), AlertDialog (5), CommandPalette (1), LoadingOverlay (1) | `focus-trap` | shipped |
| Scroll lock / sibling inert | Dialog, Modal, Drawer | `modality` (inert siblings) | shipped |
| Portal | Overlays, Toast, Tooltip | `portal` | shipped |
| Floating positioning | Popover (5), Tooltip (3), Select (2), DropdownMenu (2) | — | **missing** |
| Roving tabindex | RadioGroup (5), ToggleGroup (4), DropdownMenu (3), Toolbar (3), Menubar (2), Tabs (1), ContextMenu (1) | — | **missing** |
| Type-ahead selection | DropdownMenu (7), Select (5), Menubar (3), Tree (2), ListBox (2), ContextMenu (2), Autocomplete (1) | — | **missing** |
| Controlled+uncontrolled state | Accordion (3), Checkbox, Tabs, Switch, Tooltip, Dialog, Collapsible, NumberInput, Autocomplete, Input | codegen template (per-spec hook) | pattern |
| `asChild` slot | Button, Checkbox, Switch, Badge, Dialog, Accordion, Divider, Label, AlertDialog, VisuallyHidden, … (21 components) | codegen template (Slot wrapper) | pattern (per §1.6) |
| `data-state` attribute | Per-component (open/closed/active/etc.) | codegen template (state→attribute reflection) | pattern |

**Action items derived from this section:**

- File primitive issues: floating-positioning, roving-tabindex, type-ahead. Each
  blocks ≥4 downstream components from shipping cleanly.
- Codegen patterns (asChild Slot, controlled/uncontrolled hook, data-state
  reflection) are template work in `scripts/codegen/` — track separately from
  primitive issues; they ride along with the first component that needs them.

These three missing primitives are the only base-code work that the survey
output justifies. Everything else routes through existing primitives or
codegen.

---

## 3. ARIA + keyboard signal table

Per pattern, the components that surface it most strongly in the survey. Use
this as a checklist when writing the a11y section of a per-component issue —
if the consensus says a primitive emits `aria-expanded`, the issue should
specify the prop or state that drives it.

### ARIA attributes

| Pattern | Components | System hits |
| --- | --- | --- |
| `aria-expanded` | 11 | 40 |
| `aria-describedby` | 10 | 39 |
| `aria-pressed` | 7 | 18 |
| `aria-hidden` | 7 | 11 |
| `aria-invalid` | 6 | 25 |
| `role=dialog` | 6 | 25 |
| `aria-activedescendant` | 6 | 14 |
| `aria-labelledby` | 6 | 14 |
| `aria-busy` | 5 | 10 |
| `aria-selected` | 5 | 10 |
| `role=progressbar` | 4 | 23 |
| `role=radiogroup` | 4 | 17 |
| `role=status` | 4 | 10 |
| `aria-haspopup` | 4 | 6 |
| `role=alert` | 3 | 19 |
| `aria-checked` | 3 | 17 |
| `role=tooltip` | 3 | 10 |
| `aria-live` | 3 | 10 |
| `aria-controls` | 3 | 6 |

### Keyboard

| Pattern | Components | System hits |
| --- | --- | --- |
| Arrow keys navigate | 27 | 85 |
| Tab traps focus | 6 | 36 |
| Escape closes | 12 | 32 |
| Type-ahead | 7 | 22 |
| Roving tabindex | 7 | 19 |
| Home/End | 5 | 12 |
| Enter/Space activates | 2 | 4 |

---

## 4. Alias clusters

Components observed under multiple names across systems. Each cluster gets
resolved at issue time, not here. The doc only flags the clusters worth
surfacing during per-component synthesis.

### 4.1 Same component, different name (confirmed fold)

These are the survey's strongest "obviously one component" candidates. Per-
component issue picks the canon and folds the rest:

| Canon | Aliases (selection) | Sys | Teseor |
| --- | --- | --- | --- |
| Divider | `Divider`, `Separator`, `Dividers` | 16 | missing |
| HorizontalRule (folds into Divider) | `Horizontal rule (hr)`, `HorizontalRule`, `prose hr` | 7 | missing |
| Menu | `Menu`, `Dropdown`, `Dropdown menu`, `DropdownMenu`, `ActionMenu` | 24 | missing |
| RadioGroup | `Radio`, `Radio Group`, `RadioGroup`, `RadioButtonGroup` | 23 | missing |
| List | `List`, `OrderedList`, `UnorderedList`, `prose ul`, `prose ol`, `prose li` | 18 | missing |
| Heading | `Heading`, `Title`, `prose h1..h6` | 16 | missing |

### 4.2 Different names that need an editorial call

Visually similar, semantically distinct in some systems and merged in others.
Per-component issue surfaces the call:

| Cluster | Tension |
| --- | --- |
| **Alert vs Callout vs Admonition** | Alert (17 sys) is in-app status; Callout/Admonition (19 alias surface) is in-prose. Same visual treatment, different context. Pick: one component with a `context` prop, or two? |
| **Modal vs Dialog** | Modal (Teseor existing) shipped as `Modal`; Dialog dominant elsewhere. Survey calls both "Dialog." Rename held — surface per CLAUDE.md. |
| **Tabs vs Tablist** | Teseor ships `Tablist`; survey canon is `Tabs`. Rename held. |
| **Cluster vs Group vs Inline** | Teseor ships `Cluster`; competing names include `Group`, `Inline`, `HStack`. Rename held. |
| **Snackbar vs Toast** | Toast canon (15 sys). Snackbar is the Material name only. Fold to Toast. |
| **DateField vs DatePicker vs Calendar** | DatePicker (14 sys) is the composite popover; DateField is the input alone; Calendar is the grid primitive. Likely three separate components in Teseor, with shared Calendar primitive. |

### 4.3 Sub-variants of a base component (fold via prop)

Could be separate components or one base + variants. Lean toward the base:

| Cluster | Suggested fold |
| --- | --- |
| Button + IconButton + ToggleButton + SplitButton + ActionIcon + CopyButton + FileButton | Base `Button` with `variant`, `pressed` (for toggle), wrapper for split. IconButton = Button with icon-only content. |
| OrderedList + UnorderedList | Base `List` with `ordered: boolean` prop. Renders `<ol>` vs `<ul>`. |
| Divider + HorizontalRule | One `Divider` (see §4.1). |

### 4.4 Notable single-system patterns to ignore

Worth noting that we considered them and chose not to adopt:

- `overrides` (42 components, all BaseWeb) — BaseWeb's component-overrides API.
  Not a vocabulary; an architectural pattern. Skip.
- `HTMLAttributes` (14 components, mostly Tiptap) — Tiptap's render-attr
  passthrough. Skip.
- `sx` prop (3 components, MUI) — runtime style API. Not Teseor's model. Skip.

---

## 5. Inputs to the per-component issue template

Every issue body filed from the survey should answer:

1. **Behavior.** 2–4 sentences. What it does. Composing parts if any.
2. **Props table.** Per prop: type, default, source (§1 if shared canon, or
   component-specific). Note when a canonical prop is missing because the
   component doesn't need it.
3. **Mechanism wiring.** For each behavior in §2 (escape, focus trap, …), name
   the primitive or codegen pattern. If `missing`, the issue is blocked on
   filing the primitive issue first.
4. **A11y signature.** Roles + ARIA attributes the component emits. Cross-check
   against §3.
5. **Aliases / rename.** §4 cluster the component belongs to. Editorial call
   surfaced explicitly if it touches Teseor's existing exports.
6. **Out of scope.** Features observed in ≤3 systems are deferred by default.
   Issue lists them, doesn't include them.
7. **References.** Source URLs (from `component-survey-cards.md`).

---

## 6. Drift policy

This doc derives from the survey snapshot. If a per-component synthesis reveals
the canon was wrong (e.g. a prop pattern reverses), update the row here in the
same PR as the component issue, with the new frequency justification. Never
silently diverge.
