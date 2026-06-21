<!-- markdownlint-disable MD033 -->

# Component competitive survey — detail cards

Per-canonical-component aggregation: which systems ship it, props observed across systems (with frequency), distinct a11y/ARIA notes, distinct design choices, and source URLs. This file is the input for issue drafting — copy the relevant card into each per-component issue body.

**Scope:** cards rendered only for `covered` + `p1-docs-and-app` + `p1-app-core` (the actionable bucket). Raw per-system data for the remaining ~100 P2/P3 consensus components is preserved in `.local/component-survey/raw-workflow-output.json` + `raw-workflow-1b-output.json` and `consolidated.json`. Re-run `.local/component-survey/render-cards.mjs` after promoting a P2/P3 entry to extend the file.

See `component-survey.md` for the synthesis, bucket counts, and rename observations.

## Already covered by Teseor

10 components.

### Button

**Systems including:** 28  |  **Lens:** both  |  **Teseor:** shipped

**Category:** primitive (all 28 systems)

**Aliases observed:** `ActionIcon`, `Button`, `Button (button + submit/reset/button-typed inputs)`, `Buttons`, `Buttons (UI Blocks)`, `CopyButton`, `FileButton`, `Icon Button`, `IconButton`, `SplitButton`, `Toggle Button`, `ToggleButton` (+3 more)

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `disabled` | 9 (Base UI, Catalyst (Tailwind Labs), Headless UI (React), Pico.css +5 more) |
| `size` | 9 (Ant Design, BaseWeb (Uber), Carbon (IBM), Chakra UI +5 more) |
| `type` | 9 (Ant Design, Base UI, Headless UI (React), MVP.css +5 more) |
| `variant` | 5 (Chakra UI, HeroUI, Polaris (Shopify), Primer (GitHub), shadcn/ui) |
| `icon` | 4 (Ant Design, Fluent UI React (v9 / Fluent 2), Polaris (Shopify), Primer (GitHub)) |
| `onChange` | 4 (HeroUI, MUI (Material UI), React Aria Components, React Spectrum (Adobe)) |
| `color` | 3 (Catalyst (Tailwind Labs), HeroUI, MUI (Material UI)) |
| `isSelected` | 3 (HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `onClick` | 3 (BaseWeb (Uber), Fluent UI React (v9 / Fluent 2), Mantine) |
| `appearance` | 2 (Atlassian Design System, Fluent UI React (v9 / Fluent 2)) |
| `aria-label` | 2 (Chakra UI, Primer (GitHub)) |
| `defaultSelected` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `isDisabled` | 2 (Atlassian Design System, React Aria Components) |
| `isLoading` | 2 (Atlassian Design System, BaseWeb (Uber)) |
| `kind` | 2 (BaseWeb (Uber), Carbon (IBM)) |
| `loading` | 2 (Ant Design, Polaris (Shopify)) |
| `shape` | 2 (Ant Design, BaseWeb (Uber)) |
| `value` | 2 (FormKit, MUI (Material UI)) |
| `align` | 1 (Carbon (IBM)) |
| `aria-busy` | 1 (Pico.css) |
| `as` | 1 (Headless UI (React)) |
| `asChild` | 1 (shadcn/ui) |
| `autoFocus` | 1 (Headless UI (React)) |
| `block` | 1 (Ant Design) |
| `checked` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `colorPalette` | 1 (Chakra UI) |
| `component` | 1 (Mantine) |
| `danger` | 1 (Ant Design) |
| `defaultChecked` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `endEnhancer` | 1 (BaseWeb (Uber)) |
| `enforced` | 1 (FormKit) |
| `href` | 1 (Catalyst (Tailwind Labs)) |
| `iconAfter` | 1 (Atlassian Design System) |
| `iconBefore` | 1 (Atlassian Design System) |
| `isExpressive` | 1 (Carbon (IBM)) |
| `isQuiet` | 1 (React Spectrum (Adobe)) |
| `label` | 1 (Carbon (IBM)) |
| `multiple` | 1 (FormKit) |
| `name` | 1 (FormKit) |
| `onPress` | 1 (React Aria Components) |
| _… +12 more props_ | |

**A11y / ARIA observations:**

- native button semantics — _MVP.css, Simple.css, Water.css +2 more_
- Native button semantics — _Mantine, Tailwind Plus UI Blocks_
- Native button; aria-disabled when disabled+loading — _Ant Design_
- Native button; loading state announces. — _Atlassian Design System_
- Native button semantics; disabled state styling hooks — _Base UI_
- Native button semantics; aria-label/labelledby/describedby passthrough; aria-disabled when isLoading — _BaseWeb (Uber)_
- Native button; aria-pressed for toggle; role=button if non-button element — _Bootstrap_
- Tooltip labels the button; aria-label required. — _Carbon (IBM)_
- Extends Headless UI Button or Link; data-slot="icon" hook — _Catalyst (Tailwind Labs)_
- Mandates aria-label — _Chakra UI_
- aria-pressed for selected state — _Fluent UI React (v9 / Fluent 2)_
- role=radiogroup or group of toggle buttons (aria-pressed) — _FormKit_
- Native button semantics; data-hover/data-focus/data-active attributes — _Headless UI (React)_
- aria-pressed — _HeroUI_
- aria-pressed for single; role=group for ToggleButtonGroup — _MUI (Material UI)_
- native button semantics; aria-busy renders loading spinner — _Pico.css_
- Native button semantics; loading announced; aria-pressed for toggle pattern. — _Polaris (Shopify)_
- aria-label required; built-in tooltip. — _Primer (GitHub)_
- Button with aria-pressed toggle state — _React Aria Components_
- Default button slot used by nav buttons — _React Day Picker_
- button with aria-pressed — _React Spectrum (Adobe)_
- btn-disabled pairs tabindex=-1 + role=button on non-button elements — _daisyUI_
- Native button semantics; cursor:default per Tailwind v4 — _shadcn/ui_

**Design choices observed:**

- type=primary|default|dashed|link|text; built-in loading state — _Ant Design_
- Appearance variants (default/primary/subtle/warning/danger/link/discovery); split-button via ButtonGroup. — _Atlassian Design System_
- Single-element primitive with \`render\` prop slot — _Base UI_
- Single button with start/end enhancers, kind+shape+size token grid — _BaseWeb (Uber)_
- .btn + .btn-{color}/.btn-outline-{color}; .btn-lg/.btn-sm sizes — _Bootstrap_
- Tooltip is required and renders automatically. — _Carbon (IBM)_
- Polymorphic via href; mutually exclusive outline/plain style modes; ~20 named colors — _Catalyst (Tailwind Labs)_
- Button variant for icon-only triggers — _Chakra UI_
- Pressed-state variant of Button — _Fluent UI React (v9 / Fluent 2)_
- Pro input; segmented control replacement for radio/select — _FormKit_
- Polymorphic via \`as\`; thin wrapper exposing interaction-state data attrs — _Headless UI (React)_
- React Aria ToggleButton primitive — _HeroUI_
- Used within ToggleButtonGroup for exclusive/multiple selection — _MUI (Material UI)_
- filled button; a with b/strong child styles as solid link button, a with em/i as outline — _MVP.css_
- Polymorphic button without theme styling — _Mantine_
- variants via .secondary/.contrast/.outline class modifiers; a\[role=button\] supported — _Pico.css_
- Variant (primary/secondary/tertiary/plain) plus tone (critical/success); url prop turns it into a link. — _Polaris (Shopify)_
- Tooltip auto-rendered from aria-label. — _Primer (GitHub)_
- Render-prop selected/pressed state; data-selected attr — _React Aria Components_
- Shared button atom slot — _React Day Picker_
- Pressed-state variant of ActionButton — _React Spectrum (Adobe)_
- filled accent button; .button class extends to links — _Simple.css_
- 8 button style variants — _Tailwind Plus UI Blocks_
- filled background, classless — _Water.css_
- input\[type=submit|button|reset\] share button styling; disabled and focus states defined — _awsm.css_
- Class API: btn + btn-{color} + btn-{outline|dash|soft|ghost|link} + btn-{xs..xl} + btn-{square|circle|wide|block} — _daisyUI_
- filled button, classless — _new.css_
- CVA variants (default/destructive/outline/secondary/ghost/link); Radix Slot via asChild — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/button) — `Button`
- [Atlassian Design System](https://atlassian.design/components/button/examples) — `Button`
- [Base UI](https://base-ui.com/react/components/button) — `Button`
- [BaseWeb (Uber)](https://baseweb.design/components/button/) — `Button`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/buttons/) — `Buttons`
- [Carbon (IBM)](https://github.com/carbon-design-system/carbon/tree/main/packages/react/src/components/IconButton) — `IconButton`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/button) — `Button`
- [Chakra UI](https://chakra-ui.com/docs/components/icon-button) — `Icon Button`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-button-togglebutton--docs) — `ToggleButton`
- [FormKit](https://formkit.com/inputs/togglebuttons) — `togglebuttons`
- [Headless UI (React)](https://headlessui.com/react/button) — `Button`
- [HeroUI](https://heroui.com/en/docs/react/components/toggle-button) — `Toggle Button`
- [MUI (Material UI)](https://mui.com/material-ui/react-toggle-button/) — `Toggle Button`
- [MVP.css](https://andybrewer.github.io/mvp/) — `Button`
- [Mantine](https://mantine.dev/core/unstyled-button/) — `UnstyledButton`
- [Pico.css](https://picocss.com/docs/button) — `Button`
- [Polaris (Shopify)](https://polaris.shopify.com/components/actions/button) — `Button`
- [Primer (GitHub)](https://primer.style/components/icon-button) — `IconButton`
- [React Aria Components](https://react-aria.adobe.com/ToggleButton) — `ToggleButton`
- [React Day Picker](https://daypicker.dev/guides/custom-components) — `Button`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/ToggleButton.html) — `ToggleButton`
- [Simple.css](https://simplecss.org/demo) — `Button`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/elements/buttons) — `Buttons (UI Blocks)`
- [Water.css](https://watercss.kognise.dev/) — `Button`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Button (button + submit/reset/button-typed inputs)`
- [daisyUI](https://daisyui.com/components/button/) — `Button`
- [new.css](https://newcss.net/usage/elements/) — `Button`
- [shadcn/ui](https://ui.shadcn.com/docs/components/button) — `Button`

---

### Tabs

**Systems including:** 23  |  **Lens:** both  |  **Teseor:** shipped-as-tablist

**Category:** composite (all 23 systems)

**Aliases observed:** `TabItem`, `TabList / Tab`, `Tabs`, `Tabs (UI Blocks)`, `Tabs (npm2yarn)`, `Tabs.Tab`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `orientation` | 10 (Ark UI, Base UI, BaseWeb (Uber), Chakra UI +6 more) |
| `value` | 7 (Ark UI, Base UI, Chakra UI, MUI (Material UI) +3 more) |
| `onChange` | 6 (Atlassian Design System, BaseWeb (Uber), Carbon (IBM), Headless UI (React), MUI (Material UI), Mantine) |
| `onValueChange` | 5 (Ark UI, Base UI, Chakra UI, Radix UI Primitives, shadcn/ui) |
| `defaultValue` | 4 (Ark UI, Base UI, Radix UI Primitives, shadcn/ui) |
| `activationMode` | 3 (Ark UI, Chakra UI, shadcn/ui) |
| `items` | 3 (Ant Design, React Aria Components, React Spectrum (Adobe)) |
| `onSelectionChange` | 3 (HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `selectedKey` | 3 (HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `size` | 3 (Ant Design, Fluent UI React (v9 / Fluent 2), HeroUI) |
| `variant` | 3 (HeroUI, MUI (Material UI), Mantine) |
| `activeKey` | 2 (Ant Design, BaseWeb (Uber)) |
| `centered` | 2 (Ant Design, MUI (Material UI)) |
| `keyboardActivation` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `selected` | 2 (Atlassian Design System, Polaris (Shopify)) |
| `selectedIndex` | 2 (Carbon (IBM), Headless UI (React)) |
| `vertical` | 2 (Fluent UI React (v9 / Fluent 2), Headless UI (React)) |
| `activateOnFocus` | 1 (BaseWeb (Uber)) |
| `activateTabWithKeyboard` | 1 (Mantine) |
| `activationDirection` | 1 (Base UI) |
| `activationMode (automatic\|manual)` | 1 (Radix UI Primitives) |
| `appearance` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `borderBottom` | 1 (Mintlify) |
| `color` | 1 (HeroUI) |
| `defaultIndex` | 1 (Headless UI (React)) |
| `defaultSelectedKey` | 1 (React Aria Components) |
| `defaultTabIndex` | 1 (Mintlify) |
| `density` | 1 (React Spectrum (Adobe)) |
| `dir` | 1 (Radix UI Primitives) |
| `disclosureText` | 1 (Polaris (Shopify)) |
| `dismissable` | 1 (Carbon (IBM)) |
| `fitted` | 1 (Polaris (Shopify)) |
| `icon` | 1 (Astro Starlight) |
| `id` | 1 (Atlassian Design System) |
| `isVertical` | 1 (HeroUI) |
| `label` | 1 (Astro Starlight) |
| `lazyMount` | 1 (Chakra UI) |
| `loop` | 1 (Ark UI) |
| `manual` | 1 (Headless UI (React)) |
| `npm2yarn` | 1 (Docusaurus) |
| _… +14 more props_ | |

**A11y / ARIA observations:**

- role=tablist/tab/tabpanel; arrow-key navigation — _Ant Design, Mantine_
- tablist/tab/tabpanel ARIA. — _Atlassian Design System, Carbon (IBM)_
- WAI-ARIA Tabs with arrow nav, Home/End, manual/automatic activation — _Ark UI_
- Label required as visible tab text — _Astro Starlight_
- WAI-ARIA Tabs with arrow nav, Home/End, manual or automatic activation — _Base UI_
- role=tablist/tab/tabpanel with arrow-key navigation — _BaseWeb (Uber)_
- role=tablist/tab/tabpanel; arrow keys; auto/manual activation — _Chakra UI_
- Inherits Tabs ARIA semantics. — _Docusaurus_
- role=tablist/tab/tabpanel; auto/manual activation via selectTabOnFocus — _Fluent UI React (v9 / Fluent 2)_
- WAI-ARIA Tabs with arrow/Home/End nav; manual or automatic activation — _Headless UI (React)_
- React Aria Tabs: role=tablist/tab/tabpanel; arrow-key nav — _HeroUI_
- role=tablist/tab/tabpanel; arrow-key navigation; aria-controls wiring — _MUI (Material UI)_
- Cross-page sync supports cognitive accessibility; ARIA pattern not documented — _Mintlify_
- Acts as tab panel. — _Nextra_
- tablist/tab/tabpanel ARIA wiring. — _Polaris (Shopify)_
- WAI-ARIA Tabs pattern with arrow/Home/End nav and roving tabindex — _Radix UI Primitives_
- WAI-ARIA Tabs with arrow/Home/End nav and manual/automatic activation — _React Aria Components_
- role=tablist/tab/tabpanel; manual/automatic activation — _React Spectrum (Adobe)_
- role="tablist" for tablist variants — _Tailwind Plus UI Blocks_
- Hidden radio inputs for active state; role=tab implied — _daisyUI_
- Radix primitive: role="tablist", arrow key nav, manual/automatic activation — _shadcn/ui_

**Design choices observed:**

- type=line|card|editable-card; items-prop API — _Ant Design_
- Part-based (Root/List/Trigger/Content/Indicator) — _Ark UI_
- Required inside Tabs; icon from built-in Starlight set — _Astro Starlight_
- Compound TabList/Tab/TabPanel; unmount control. — _Atlassian Design System_
- Part-based (Root/List/Tab/Panel/Indicator); Indicator part for animated underline — _Base UI_
- Stateful + Stateless; Tab + TabPanel slot pattern; tabs-motion variant adds animated underline — _BaseWeb (Uber)_
- Compound TabList/Tab/TabPanels/TabPanel; controlled or uncontrolled. — _Carbon (IBM)_
- Composite Tabs.\* parts; FloatingIndicator integration — _Chakra UI_
- Remark plugin that turns a single npm fenced block into a Tabs group across npm/yarn/pnpm/bun. — _Docusaurus_
- Slot-based TabList + Tab; panels rendered separately by app — _Fluent UI React (v9 / Fluent 2)_
- Part-based (TabGroup/TabList/Tab/TabPanels/TabPanel); index-based value; render-prop selected state — _Headless UI (React)_
- Composite Tabs + Tab; variants solid/underlined/bordered/light — _HeroUI_
- Composite Tabs + Tab; variant standard/scrollable/fullWidth — _MUI (Material UI)_
- Composite Tabs.List + Tab + Panel — _Mantine_
- Wrapper around Tab children; auto-sync by matching titles across page — _Mintlify_
- Static sub-component of Tabs; one Tabs.Tab per items entry. — _Nextra_
- Array config + selected index; overflow disclosure. — _Polaris (Shopify)_
- Part-based (Root/List/Trigger/Content); controlled+uncontrolled; data-state styling — _Radix UI Primitives_
- Part-based (Tabs/TabList/Tab/TabPanel); key-based with collection items — _React Aria Components_
- TabList + TabPanels collection; slot-based icon/text — _React Spectrum (Adobe)_
- 9 tab block variants (markup or Headless UI Tab) — _Tailwind Plus UI Blocks_
- Native radio-input based or anchor-based; tabs + tab + tab-active + tabs-{box|border|lift} + tab-content — _daisyUI_
- Radix-based; Root/List/Trigger/Content parts — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/tabs) — `Tabs`
- [Ark UI](https://ark-ui.com/docs/components/tabs) — `Tabs`
- [Astro Starlight](https://starlight.astro.build/components/tabs/) — `TabItem`
- [Atlassian Design System](https://atlassian.design/components/tabs/examples) — `Tabs`
- [Base UI](https://base-ui.com/react/components/tabs) — `Tabs`
- [BaseWeb (Uber)](https://baseweb.design/components/tabs-motion/) — `Tabs`
- [Carbon (IBM)](https://carbondesignsystem.com/components/tabs/usage/) — `Tabs`
- [Chakra UI](https://chakra-ui.com/docs/components/tabs) — `Tabs`
- [Docusaurus](https://docusaurus.io/docs/markdown-features/code-blocks#multi-language-support-code-blocks) — `Tabs (npm2yarn)`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-tablist--docs) — `TabList / Tab`
- [Headless UI (React)](https://headlessui.com/react/tabs) — `Tabs`
- [HeroUI](https://heroui.com/en/docs/react/components/tabs) — `Tabs`
- [MUI (Material UI)](https://mui.com/material-ui/react-tabs/) — `Tabs`
- [Mantine](https://mantine.dev/core/tabs/) — `Tabs`
- [Mintlify](https://mintlify.com/docs/components/tabs) — `Tabs`
- [Nextra](https://nextra.site/docs/built-ins/tabs) — `Tabs.Tab`
- [Polaris (Shopify)](https://polaris.shopify.com/components/navigation/tabs) — `Tabs`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/tabs) — `Tabs`
- [React Aria Components](https://react-aria.adobe.com/Tabs) — `Tabs`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Tabs.html) — `Tabs`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/navigation/tabs) — `Tabs (UI Blocks)`
- [daisyUI](https://daisyui.com/components/tab/) — `Tabs`
- [shadcn/ui](https://ui.shadcn.com/docs/components/tabs) — `Tabs`

---

### Tooltip

**Systems including:** 21  |  **Lens:** app  |  **Teseor:** shipped

**Category mix:** composite×14, primitive×7

**Aliases observed:** `Tooltip`, `Tooltip (Popover trigger)`, `Tooltips`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `open` | 6 (Ant Design, Ark UI, Base UI, MUI (Material UI), Radix UI Primitives, shadcn/ui) |
| `placement` | 6 (Ant Design, BaseWeb (Uber), HeroUI, MUI (Material UI), React Aria Components, React Spectrum (Adobe)) |
| `closeDelay` | 5 (Ark UI, Base UI, Chakra UI, HeroUI, React Aria Components) |
| `content` | 5 (Atlassian Design System, BaseWeb (Uber), Fluent UI React (v9 / Fluent 2), HeroUI, Polaris (Shopify)) |
| `onOpenChange` | 5 (Ark UI, Base UI, Radix UI Primitives, React Aria Components, shadcn/ui) |
| `defaultOpen` | 4 (Ark UI, Base UI, Radix UI Primitives, React Aria Components) |
| `delay` | 4 (Atlassian Design System, Base UI, HeroUI, React Aria Components) |
| `openDelay` | 3 (Ark UI, Chakra UI, Mantine) |
| `positioning` | 3 (Ark UI, Chakra UI, Fluent UI React (v9 / Fluent 2)) |
| `showArrow` | 3 (BaseWeb (Uber), Chakra UI, HeroUI) |
| `align` | 2 (Carbon (IBM), Radix UI Primitives) |
| `arrow` | 2 (Ant Design, MUI (Material UI)) |
| `children` | 2 (Mintlify, React Spectrum (Adobe)) |
| `color` | 2 (Ant Design, HeroUI) |
| `delayDuration` | 2 (Radix UI Primitives, shadcn/ui) |
| `isOpen` | 2 (HeroUI, React Aria Components) |
| `label` | 2 (Carbon (IBM), Mantine) |
| `position` | 2 (Atlassian Design System, Mantine) |
| `side` | 2 (Radix UI Primitives, shadcn/ui) |
| `title` | 2 (Ant Design, MUI (Material UI)) |
| `trigger` | 2 (Ant Design, React Aria Components) |
| `withArrow` | 2 (Fluent UI React (v9 / Fluent 2), Mantine) |
| `active` | 1 (Polaris (Shopify)) |
| `appearance` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `autoAlign` | 1 (Carbon (IBM)) |
| `cta` | 1 (Mintlify) |
| `data-placement` | 1 (Pico.css) |
| `data-tooltip` | 1 (Pico.css) |
| `description` | 1 (Carbon (IBM)) |
| `direction` | 1 (Primer (GitHub)) |
| `disabled` | 1 (Ark UI) |
| `disableHoverableContent` | 1 (Radix UI Primitives) |
| `dismissOnMouseOut` | 1 (Polaris (Shopify)) |
| `enterDelay` | 1 (MUI (Material UI)) |
| `enterDelayMs` | 1 (Carbon (IBM)) |
| `events` | 1 (Mantine) |
| `headline` | 1 (Mintlify) |
| `hideDelay` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `hideTooltipOnClick` | 1 (Atlassian Design System) |
| `hoverable` | 1 (Base UI) |
| _… +17 more props_ | |

**A11y / ARIA observations:**

- aria-describedby ties trigger to tooltip. — _Atlassian Design System, Polaris (Shopify)_
- WAI-ARIA Tooltip; hover/focus trigger; Esc dismiss — _Base UI, React Aria Components_
- role=tooltip; aria-describedby on child — _Ant Design_
- WAI-ARIA Tooltip with hover/focus trigger and Esc dismiss — _Ark UI_
- aria-describedby links trigger to tooltip content — _BaseWeb (Uber)_
- Opt-in via JS plugin; pair with role=tooltip — _Bootstrap_
- aria-labelledby or aria-describedby per label vs description. — _Carbon (IBM)_
- role=tooltip; aria-describedby on trigger — _Chakra UI_
- relationship=label/description controls aria-labelledby vs aria-describedby on trigger — _Fluent UI React (v9 / Fluent 2)_
- React Aria Tooltip: role=tooltip; aria-describedby on trigger; touch-handling per React Aria guidelines — _HeroUI_
- role=tooltip; aria-describedby wired to anchor — _MUI (Material UI)_
- role=tooltip; aria-describedby on target — _Mantine_
- Hover trigger; keyboard activation guidance not specified — _Mintlify_
- data-tooltip exposes label visually; relies on element's own accessible name — _Pico.css_
- aria-describedby; type=label switches to aria-labelledby. — _Primer (GitHub)_
- WAI-ARIA Tooltip pattern; hover/focus triggered; Esc dismiss; not for keyboard-essential info — _Radix UI Primitives_
- role=tooltip; aria-describedby on trigger via TooltipTrigger — _React Spectrum (Adobe)_
- Uses data-tip attribute and ::before/::after CSS — _daisyUI_
- Radix primitive: role="tooltip", aria-describedby on trigger — _shadcn/ui_

**Design choices observed:**

- Trigger child + title prop — _Ant Design_
- Part-based (Root/Trigger/Positioner/Content/Arrow); shared timer between instances — _Ark UI_
- Non-interactive only; hover/focus. — _Atlassian Design System_
- Part-based (Provider/Root/Trigger/Portal/Positioner/Popup/Arrow); cursor-tracking option — _Base UI_
- Popover with triggerType='hover' renders as tooltip — _BaseWeb (Uber)_
- data-bs-toggle=tooltip + title; Popper.js positioning — _Bootstrap_
- Wraps a focusable child; hover/focus only. — _Carbon (IBM)_
- Composite Tooltip.\* parts; shared TooltipProvider — _Chakra UI_
- Single-child trigger pattern with managed visibility; portalled surface — _Fluent UI React (v9 / Fluent 2)_
- Composite Tooltip + tooltip trigger wrapping child — _HeroUI_
- Popper-based; controlled+uncontrolled — _MUI (Material UI)_
- Floating UI-based positioning — _Mantine_
- Wraps inline text; supports CTA link inside tooltip body — _Mintlify_
- data-attribute-driven CSS-only tooltip with placement variants — _Pico.css_
- Auto-positions; not for interactive content. — _Polaris (Shopify)_
- Wraps a single focusable child. — _Primer (GitHub)_
- Part-based (Provider/Root/Trigger/Portal/Content/Arrow); shared delay timer via Provider — _Radix UI Primitives_
- Part-based (TooltipTrigger/Tooltip); focus-only or hover+focus trigger modes — _React Aria Components_
- Used inside TooltipTrigger; hover/focus only — _React Spectrum (Adobe)_
- CSS-only tooltip via data-tip; tooltip + tooltip-{top|bottom|left|right|open} + tooltip-{color} — _daisyUI_
- Radix-based; Provider/Root/Trigger/Content parts — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/tooltip) — `Tooltip`
- [Ark UI](https://ark-ui.com/docs/components/tooltip) — `Tooltip`
- [Atlassian Design System](https://atlassian.design/components/tooltip/examples) — `Tooltip`
- [Base UI](https://base-ui.com/react/components/tooltip) — `Tooltip`
- [BaseWeb (Uber)](https://baseweb.design/components/popover/) — `Tooltip (Popover trigger)`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/tooltips/) — `Tooltips`
- [Carbon (IBM)](https://carbondesignsystem.com/components/tooltip/usage/) — `Tooltip`
- [Chakra UI](https://chakra-ui.com/docs/components/tooltip) — `Tooltip`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-tooltip--docs) — `Tooltip`
- [HeroUI](https://heroui.com/en/docs/react/components/tooltip) — `Tooltip`
- [MUI (Material UI)](https://mui.com/material-ui/react-tooltip/) — `Tooltip`
- [Mantine](https://mantine.dev/core/tooltip/) — `Tooltip`
- [Mintlify](https://mintlify.com/docs/components/tooltips) — `Tooltip`
- [Pico.css](https://picocss.com/docs/tooltip) — `Tooltip`
- [Polaris (Shopify)](https://polaris.shopify.com/components/overlays/tooltip) — `Tooltip`
- [Primer (GitHub)](https://primer.style/components/tooltip) — `Tooltip`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/tooltip) — `Tooltip`
- [React Aria Components](https://react-aria.adobe.com/Tooltip) — `Tooltip`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Tooltip.html) — `Tooltip`
- [daisyUI](https://daisyui.com/components/tooltip/) — `Tooltip`
- [shadcn/ui](https://ui.shadcn.com/docs/components/tooltip) — `Tooltip`

---

### Dialog

**Systems including:** 18  |  **Lens:** both  |  **Teseor:** shipped-as-modal

**Category mix:** composite×17, primitive×1

**Aliases observed:** `Dialog`, `Dialog (modal)`, `Modal dialog`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `open` | 12 (Ark UI, Base UI, Carbon (IBM), Catalyst (Tailwind Labs) +8 more) |
| `onClose` | 7 (Atlassian Design System, BaseWeb (Uber), Catalyst (Tailwind Labs), Headless UI (React) +3 more) |
| `onOpenChange` | 7 (Ark UI, Base UI, Chakra UI, Fluent UI React (v9 / Fluent 2) +3 more) |
| `defaultOpen` | 6 (Ark UI, Base UI, Fluent UI React (v9 / Fluent 2), Radix UI Primitives, React Aria Components, shadcn/ui) |
| `modal` | 6 (Ark UI, Base UI, Carbon (IBM), Chakra UI, Radix UI Primitives, shadcn/ui) |
| `size` | 5 (BaseWeb (Uber), Catalyst (Tailwind Labs), Chakra UI, Mantine, React Spectrum (Adobe)) |
| `role` | 3 (BaseWeb (Uber), Chakra UI, React Aria Components) |
| `initialFocus` | 2 (Base UI, Headless UI (React)) |
| `isDismissable` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `isOpen` | 2 (BaseWeb (Uber), React Aria Components) |
| `width` | 2 (Atlassian Design System, Primer (GitHub)) |
| `as` | 1 (Headless UI (React)) |
| `asChild` | 1 (Radix UI Primitives) |
| `autoFocus` | 1 (Atlassian Design System) |
| `children` | 1 (React Spectrum (Adobe)) |
| `closeable` | 1 (BaseWeb (Uber)) |
| `closeOnEscape` | 1 (Ark UI) |
| `closeOnInteractOutside` | 1 (Ark UI) |
| `dismissible` | 1 (Base UI) |
| `finalFocus` | 1 (Base UI) |
| `forceMount` | 1 (Radix UI Primitives) |
| `fullScreen` | 1 (MUI (Material UI)) |
| `fullWidth` | 1 (MUI (Material UI)) |
| `height` | 1 (Primer (GitHub)) |
| `inertTrapFocus` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `isKeyboardDismissDisabled` | 1 (React Aria Components) |
| `maxWidth` | 1 (MUI (Material UI)) |
| `modalType` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `onDismiss` | 1 (React Spectrum (Adobe)) |
| `onRequestClose` | 1 (Carbon (IBM)) |
| `opened` | 1 (Mantine) |
| `placement` | 1 (Chakra UI) |
| `position` | 1 (Mantine) |
| `preventScroll` | 1 (Ark UI) |
| `renderBody` | 1 (Primer (GitHub)) |
| `renderFooter` | 1 (Primer (GitHub)) |
| `renderHeader` | 1 (Primer (GitHub)) |
| `role (dialog\|alertdialog)` | 1 (Ark UI) |
| `scroll` | 1 (MUI (Material UI)) |
| `shouldCloseOnEscapePress` | 1 (Atlassian Design System) |
| _… +9 more props_ | |

**A11y / ARIA observations:**

- native dialog semantics — _MVP.css, Water.css_
- WAI-ARIA dialog/alertdialog with focus trap, Title/Description binding — _Ark UI_
- Focus trap; aria-modal. — _Atlassian Design System_
- WAI-ARIA Dialog with focus trap, scroll lock, Title/Description binding — _Base UI_
- role=dialog/alertdialog with focus lock and return-focus — _BaseWeb (Uber)_
- Uses native dialog element semantics. — _Carbon (IBM)_
- Extends Headless UI Dialog: focus trap, ESC, autoFocus opt-in — _Catalyst (Tailwind Labs)_
- role=dialog; focus trap; aria-labelledby/describedby; ESC close — _Chakra UI_
- role=dialog or alertdialog per modalType; focus trap; aria-labelledby via DialogTitle — _Fluent UI React (v9 / Fluent 2)_
- WAI-ARIA Dialog with focus trap, scroll lock, Esc close; Title/Description for SR — _Headless UI (React)_
- role=dialog; aria-labelledby/describedby; focus trap; ESC handling — _MUI (Material UI)_
- Non-modal floating panel; not focus-trapped by default — _Mantine_
- Focus trap; aria-labelledby/describedby. — _Primer (GitHub)_
- WAI-ARIA Dialog pattern; focus trap when modal; Title/Description for SR — _Radix UI Primitives_
- WAI-ARIA dialog/alertdialog with focus trap and Title binding — _React Aria Components_
- role=dialog; Heading auto-wires aria-labelledby; focus trap — _React Spectrum (Adobe)_
- Radix primitive: role="dialog", aria-modal, focus trap, ESC closes — _shadcn/ui_

**Design choices observed:**

- Part-based (Root/Backdrop/Positioner/Content/Title/Description/CloseTrigger/Trigger) — _Ark UI_
- Compound ModalHeader/ModalBody/ModalFooter/ModalTitle/ModalTransition. — _Atlassian Design System_
- Part-based (Root/Trigger/Portal/Backdrop/Popup/Title/Description/Close); modal can be true/false/'trap-focus'; createHandle() for detached triggers — _Base UI_
- Lower-level dialog primitive used by Modal — _BaseWeb (Uber)_
- Lower-level dialog primitive (newer than Modal). — _Carbon (IBM)_
- Dialog + DialogTitle + DialogDescription + DialogBody + DialogActions; size xs–5xl — _Catalyst (Tailwind Labs)_
- Composite Dialog.Root + Trigger + Backdrop + Positioner + Content — _Chakra UI_
- Dialog + DialogTrigger + DialogSurface + DialogBody/Title/Content/Actions slots — _Fluent UI React (v9 / Fluent 2)_
- Part-based (Dialog/DialogBackdrop/DialogPanel/DialogTitle/Description); requires controlled open/onClose — _Headless UI (React)_
- Composite Dialog + Title/Content/Actions; built on Modal — _MUI (Material UI)_
- classless styled dialog as modal popup — _MVP.css_
- Light-weight floating panel (not the Modal) — _Mantine_
- Render-prop slots for header/body/footer. — _Primer (GitHub)_
- Part-based (Root/Trigger/Portal/Overlay/Content/Title/Description/Close); asChild slot; controlled+uncontrolled — _Radix UI Primitives_
- Part-based (DialogTrigger/Modal/Dialog/Heading); composes with Modal/Popover — _React Aria Components_
- Used inside DialogTrigger; slot-based Heading/Content/ButtonGroup — _React Spectrum (Adobe)_
- classless styled native dialog — _Water.css_
- Radix-based; Trigger/Content/Header/Title/Description/Footer/Close parts; showCloseButton prop — _shadcn/ui_

**Source URLs:**

- [Ark UI](https://ark-ui.com/docs/components/dialog) — `Dialog`
- [Atlassian Design System](https://atlassian.design/components/modal-dialog/examples) — `Modal dialog`
- [Base UI](https://base-ui.com/react/components/dialog) — `Dialog`
- [BaseWeb (Uber)](https://baseweb.design/components/dialog/) — `Dialog`
- [Carbon (IBM)](https://github.com/carbon-design-system/carbon/tree/main/packages/react/src/components/Dialog) — `Dialog`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/dialog) — `Dialog`
- [Chakra UI](https://chakra-ui.com/docs/components/dialog) — `Dialog`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-dialog--docs) — `Dialog`
- [Headless UI (React)](https://headlessui.com/react/dialog) — `Dialog`
- [MUI (Material UI)](https://mui.com/material-ui/react-dialog/) — `Dialog`
- [MVP.css](https://andybrewer.github.io/mvp/) — `Dialog (modal)`
- [Mantine](https://mantine.dev/core/dialog/) — `Dialog`
- [Primer (GitHub)](https://primer.style/components/dialog) — `Dialog`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/dialog) — `Dialog`
- [React Aria Components](https://react-aria.adobe.com/Dialog) — `Dialog`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Dialog.html) — `Dialog`
- [Water.css](https://watercss.kognise.dev/) — `Dialog`
- [shadcn/ui](https://ui.shadcn.com/docs/components/dialog) — `Dialog`

---

### Pagination

**Systems including:** 17  |  **Lens:** both  |  **Teseor:** shipped

**Category mix:** composite×16, primitive×1

**Aliases observed:** `Pagination`, `Pagination (App)`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `onChange` | 6 (Ant Design, Atlassian Design System, Carbon (IBM), HeroUI, MUI (Material UI), Mantine) |
| `page` | 5 (Ark UI, Carbon (IBM), Chakra UI, HeroUI, MUI (Material UI)) |
| `onPageChange` | 4 (Ark UI, BaseWeb (Uber), Chakra UI, Primer (GitHub)) |
| `pageSize` | 4 (Ant Design, Ark UI, Carbon (IBM), Chakra UI) |
| `count` | 3 (Ark UI, Chakra UI, MUI (Material UI)) |
| `siblingCount` | 3 (Ark UI, Chakra UI, MUI (Material UI)) |
| `total` | 3 (Ant Design, HeroUI, Mantine) |
| `boundaries` | 2 (HeroUI, Mantine) |
| `current` | 2 (Ant Design, Catalyst (Tailwind Labs)) |
| `currentPage` | 2 (BaseWeb (Uber), Primer (GitHub)) |
| `pageCount` | 2 (Primer (GitHub), TanStack Table) |
| `siblings` | 2 (HeroUI, Mantine) |
| `size` | 2 (BaseWeb (Uber), shadcn/ui) |
| `boundaryCount` | 1 (MUI (Material UI)) |
| `className` | 1 (Catalyst (Tailwind Labs)) |
| `defaultPage` | 1 (Ark UI) |
| `getPaginationRowModel` | 1 (TanStack Table) |
| `hasNext` | 1 (Polaris (Shopify)) |
| `hasPrevious` | 1 (Polaris (Shopify)) |
| `href` | 1 (Catalyst (Tailwind Labs)) |
| `isActive` | 1 (shadcn/ui) |
| `label` | 1 (Polaris (Shopify)) |
| `manualPagination` | 1 (TanStack Table) |
| `marginPageCount` | 1 (Primer (GitHub)) |
| `max` | 1 (Atlassian Design System) |
| `numPages` | 1 (BaseWeb (Uber)) |
| `onNext` | 1 (Polaris (Shopify)) |
| `onPrevious` | 1 (Polaris (Shopify)) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `pages` | 1 (Atlassian Design System) |
| `pageSizes` | 1 (Carbon (IBM)) |
| `pagination state (pageIndex, pageSize)` | 1 (TanStack Table) |
| `selectedIndex` | 1 (Atlassian Design System) |
| `shape` | 1 (MUI (Material UI)) |
| `showControls` | 1 (HeroUI) |
| `showPages` | 1 (Primer (GitHub)) |
| `showQuickJumper` | 1 (Ant Design) |
| `showShadow` | 1 (HeroUI) |
| `showSizeChanger` | 1 (Ant Design) |
| `totalItems` | 1 (Carbon (IBM)) |
| _… +3 more props_ | |

**A11y / ARIA observations:**

- nav with aria-label; aria-current=page — _Chakra UI, Mantine_
- nav with aria-label; aria-current=page on selected — _HeroUI, MUI (Material UI)_
- nav with labels; aria-current on selected — _Ant Design_
- nav landmark with aria-label and aria-current on active page — _Ark UI_
- nav landmark; aria-current. — _Atlassian Design System_
- Nav landmark with aria-current=page on active button — _BaseWeb (Uber)_
- nav with aria-label; aria-current=page on active item — _Bootstrap_
- Labelled selects and navigation buttons. — _Carbon (IBM)_
- nav aria-label — _Catalyst (Tailwind Labs)_
- Nav landmark; button labels announced. — _Polaris (Shopify)_
- nav with aria-label; aria-current on active page. — _Primer (GitHub)_
- nav aria-label="pagination"; aria-current — _Tailwind Plus UI Blocks_
- Reuses Join classes; uses join + btn classes — _daisyUI_
- nav aria-label="pagination"; aria-current="page" on active — _shadcn/ui_

**Design choices observed:**

- Built-in size changer and quick jumper — _Ant Design_
- Part-based (Root/PrevTrigger/NextTrigger/Item/Ellipsis/Context) — _Ark UI_
- Numeric pager with ellipsis overflow. — _Atlassian Design System_
- Numeric pager with prev/next and select for jump — _BaseWeb (Uber)_
- ul.pagination + .page-item + .page-link; size modifiers — _Bootstrap_
- Full pagination with page-size selector. — _Carbon (IBM)_
- Pagination + PaginationPrevious + PaginationNext + PaginationList + PaginationPage + PaginationGap parts — _Catalyst (Tailwind Labs)_
- Composite Pagination.\* parts; render-prop Context — _Chakra UI_
- Variants light/flat/faded/bordered; loop + cursor variants — _HeroUI_
- Pagination + usePagination hook for custom UI — _MUI (Material UI)_
- Composite Pagination.\* parts; usePagination hook — _Mantine_
- Controlled prev/next pattern. — _Polaris (Shopify)_
- Numeric page links with ellipsis. — _Primer (GitHub)_
- 3 pagination variants — _Tailwind Plus UI Blocks_
- Client- or server-driven pagination — _TanStack Table_
- Composed of join + btn; not a dedicated component, documented pattern — _daisyUI_
- Compositional parts: Pagination/Content/Item/Link/Previous/Next/Ellipsis — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/pagination) — `Pagination`
- [Ark UI](https://ark-ui.com/docs/components/pagination) — `Pagination`
- [Atlassian Design System](https://atlassian.design/components/pagination/examples) — `Pagination`
- [BaseWeb (Uber)](https://baseweb.design/components/pagination/) — `Pagination`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/pagination/) — `Pagination`
- [Carbon (IBM)](https://carbondesignsystem.com/components/pagination/usage/) — `Pagination`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/pagination) — `Pagination`
- [Chakra UI](https://chakra-ui.com/docs/components/pagination) — `Pagination`
- [HeroUI](https://heroui.com/en/docs/react/components/pagination) — `Pagination`
- [MUI (Material UI)](https://mui.com/material-ui/react-pagination/) — `Pagination`
- [Mantine](https://mantine.dev/core/pagination/) — `Pagination`
- [Polaris (Shopify)](https://polaris.shopify.com/components/navigation/pagination) — `Pagination`
- [Primer (GitHub)](https://primer.style/components/pagination) — `Pagination`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/navigation/pagination) — `Pagination (App)`
- [TanStack Table](https://tanstack.com/table/latest/docs/api/features/pagination) — `Pagination`
- [daisyUI](https://daisyui.com/components/pagination/) — `Pagination`
- [shadcn/ui](https://ui.shadcn.com/docs/components/pagination) — `Pagination`

---

### Code

**Systems including:** 14  |  **Lens:** doc  |  **Teseor:** shipped

**Category mix:** primitive×13, complex×1

**Aliases observed:** `Code`, `Code (code, kbd, pre)`, `Code (code, kbd, samp, pre)`, `Code (code, kbd, var, samp, pre)`, `Code (code, pre, kbd)`, `Code (code, pre, samp)`, `Inline code (code)`, `prose code`, `prose-code`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `block` | 1 (Mantine) |
| `code` | 1 (Astro Starlight) |
| `codeStyle` | 1 (Atlassian Design System) |
| `color` | 1 (Mantine) |
| `colorPalette` | 1 (Chakra UI) |
| `frame` | 1 (Astro Starlight) |
| `HTMLAttributes` | 1 (Tiptap) |
| `lang` | 1 (Astro Starlight) |
| `language` | 1 (Atlassian Design System) |
| `mark` | 1 (Astro Starlight) |
| `showLineNumbers` | 1 (Atlassian Design System) |
| `size` | 1 (Chakra UI) |
| `text` | 1 (Atlassian Design System) |
| `title` | 1 (Astro Starlight) |
| `variant` | 1 (Chakra UI) |

**A11y / ARIA observations:**

- native code/kbd semantics — _Pico.css, Simple.css, Water.css, new.css_
- Inherits from Expressive Code; not separately documented — _Astro Starlight_
- \<code\>/\<pre\> semantics. — _Atlassian Design System_
- Semantic \<code\> — _Chakra UI_
- native code/samp semantics — _MVP.css_
- Semantic code/pre — _Mantine_
- native code/kbd/samp semantics — _Sakura.css_
- No ARIA impact — _Tailwind Typography (prose plugin)_
- Maps to \<code\> — _Tiptap_
- native code semantics — _Tufte CSS_
- native code/kbd/var/samp semantics — _awsm.css_

**Design choices observed:**

- Renders code from string prop (vs markdown fences); accepts all Expressive Code props; supports Vite ?raw imports — _Astro Starlight_
- Inline Code + CodeBlock with syntax highlighting. — _Atlassian Design System_
- Inline code styling — _Chakra UI_
- highlighted inline + block code — _MVP.css_
- Inline or block code — _Mantine_
- classless inline + block code styling with optional syntax tokens — _Pico.css_
- monospace inline + block code with background fill — _Sakura.css_
- kbd styled as key cap; code/pre with subtle background — _Simple.css_
- Element modifier targeting inline code — _Tailwind Typography (prose plugin)_
- Inline-code mark — _Tiptap_
- monospace inline term with reduced size — _Tufte CSS_
- classless inline + block code styling — _Water.css_
- monospace inline + block code — _awsm.css_
- classless inline + block code; kbd documented for keystrokes — _new.css_

**Source URLs:**

- [Astro Starlight](https://starlight.astro.build/components/code/) — `Code`
- [Atlassian Design System](https://atlassian.design/components/code/examples) — `Code`
- [Chakra UI](https://chakra-ui.com/docs/components/code) — `Code`
- [MVP.css](https://andybrewer.github.io/mvp/) — `Code (code, pre, samp)`
- [Mantine](https://mantine.dev/core/code/) — `Code`
- [Pico.css](https://picocss.com/docs/code) — `Code (code, kbd, pre)`
- [Sakura.css](https://github.com/oxalorg/sakura/blob/master/css/sakura.css) — `Code (code, kbd, samp, pre)`
- [Simple.css](https://simplecss.org/demo) — `Code (code, pre, kbd)`
- [Tailwind Typography (prose plugin)](https://github.com/tailwindlabs/tailwindcss-typography) — `prose-code`
- [Tiptap](https://tiptap.dev/docs/editor/extensions/marks/code) — `Code`
- [Tufte CSS](https://edwardtufte.github.io/tufte-css/) — `Inline code (code)`
- [Water.css](https://watercss.kognise.dev/) — `Code (code, pre, kbd)`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Code (code, kbd, var, samp, pre)`
- [new.css](https://newcss.net/usage/elements/) — `Code (code, pre, kbd)`

---

### Modal

**Systems including:** 10  |  **Lens:** both  |  **Teseor:** shipped

**Category mix:** composite×9, primitive×1

**Aliases observed:** `Modal`, `Modal (dialog)`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `open` | 4 (Ant Design, Carbon (IBM), MUI (Material UI), Pico.css) |
| `size` | 4 (BaseWeb (Uber), Carbon (IBM), HeroUI, Mantine) |
| `isOpen` | 3 (BaseWeb (Uber), HeroUI, React Aria Components) |
| `onClose` | 3 (BaseWeb (Uber), MUI (Material UI), Mantine) |
| `centered` | 2 (Ant Design, Mantine) |
| `isDismissable` | 2 (HeroUI, React Aria Components) |
| `onOpenChange` | 2 (HeroUI, React Aria Components) |
| `title` | 2 (Ant Design, Mantine) |
| `autoFocus` | 1 (BaseWeb (Uber)) |
| `backdrop` | 1 (HeroUI) |
| `BackdropComponent` | 1 (MUI (Material UI)) |
| `closeable` | 1 (BaseWeb (Uber)) |
| `confirmLoading` | 1 (Ant Design) |
| `danger` | 1 (Carbon (IBM)) |
| `defaultOpen` | 1 (React Aria Components) |
| `disableEscapeKeyDown` | 1 (MUI (Material UI)) |
| `disablePortal` | 1 (MUI (Material UI)) |
| `focusLock` | 1 (BaseWeb (Uber)) |
| `footer` | 1 (Ant Design) |
| `isKeyboardDismissDisabled` | 1 (React Aria Components) |
| `keepMounted` | 1 (MUI (Material UI)) |
| `modalHeading` | 1 (Carbon (IBM)) |
| `onCancel` | 1 (Ant Design) |
| `onOk` | 1 (Ant Design) |
| `opened` | 1 (Mantine) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `passiveModal` | 1 (Carbon (IBM)) |
| `placement` | 1 (HeroUI) |
| `primaryButtonText` | 1 (Carbon (IBM)) |
| `role` | 1 (BaseWeb (Uber)) |
| `scrollBehavior` | 1 (HeroUI) |
| `secondaryButtonText` | 1 (Carbon (IBM)) |
| `trapFocus` | 1 (Mantine) |
| `width` | 1 (Ant Design) |
| `withCloseButton` | 1 (Mantine) |

**A11y / ARIA observations:**

- role=dialog; focus trap; ESC handling — _Ant Design, Mantine_
- role=dialog/alertdialog; focus trap; returnFocus; escape support — _BaseWeb (Uber)_
- role=dialog with aria-modal; focus management via JS plugin; ESC close — _Bootstrap_
- Focus trap; aria-modal. — _Carbon (IBM)_
- role=dialog; focus trap; ESC close (React Aria) — _HeroUI_
- Focus trap; aria-hidden on background; ESC handling — _MUI (Material UI)_
- uses native dialog semantics; open attribute toggles visibility — _Pico.css_
- Modal overlay with focus trap and inert background — _React Aria Components_
- Native \<dialog\> showModal/close handles focus trap + ESC — _daisyUI_

**Design choices observed:**

- Imperative Modal.confirm/info/warning/error/success + hook-based useModal — _Ant Design_
- Modal + ModalHeader/Body/Footer/Button slots; closeSource passed to onClose — _BaseWeb (Uber)_
- .modal + .modal-dialog + .modal-content + .modal-header/-body/-footer — _Bootstrap_
- High-level shorthand vs ComposedModal compound API. — _Carbon (IBM)_
- Composite Modal + ModalContent + ModalHeader/Body/Footer; useDisclosure hook — _HeroUI_
- Low-level primitive behind Dialog/Drawer/Menu — _MUI (Material UI)_
- Composite Modal.Root + Overlay + Content + Header + Title + Body + CloseButton — _Mantine_
- dialog tag with article inside; modal-is-open class on html for body lock — _Pico.css_
- Part-based (ModalOverlay/Modal); composes with Dialog — _React Aria Components_
- Three modes: native \<dialog\> (recommended), hidden checkbox toggle, anchor links; modal-{top|middle|bottom|start|end} — _daisyUI_

**Source URLs:**

- [Ant Design](https://ant.design/components/modal) — `Modal`
- [BaseWeb (Uber)](https://baseweb.design/components/modal/) — `Modal`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/modal/) — `Modal`
- [Carbon (IBM)](https://carbondesignsystem.com/components/modal/usage/) — `Modal`
- [HeroUI](https://heroui.com/en/docs/react/components/modal) — `Modal`
- [MUI (Material UI)](https://mui.com/material-ui/react-modal/) — `Modal`
- [Mantine](https://mantine.dev/core/modal/) — `Modal`
- [Pico.css](https://picocss.com/docs/modal) — `Modal (dialog)`
- [React Aria Components](https://react-aria.adobe.com/Modal) — `Modal`
- [daisyUI](https://daisyui.com/components/modal/) — `Modal`

---

### Stack

**Systems including:** 9  |  **Lens:** both  |  **Teseor:** shipped

**Category:** layout (all 9 systems)

**Aliases observed:** `Flex`, `Stack`, `Wrap`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `gap` | 7 (Ant Design, Atlassian Design System, Carbon (IBM), Chakra UI +3 more) |
| `align` | 4 (Ant Design, Chakra UI, Mantine, Primer (GitHub)) |
| `direction` | 4 (Atlassian Design System, MUI (Material UI), Primer (GitHub), React Spectrum (Adobe)) |
| `justify` | 4 (Ant Design, Chakra UI, Mantine, Primer (GitHub)) |
| `wrap` | 4 (Ant Design, Atlassian Design System, Primer (GitHub), React Spectrum (Adobe)) |
| `alignItems` | 2 (Atlassian Design System, React Spectrum (Adobe)) |
| `justifyContent` | 2 (Atlassian Design System, React Spectrum (Adobe)) |
| `as` | 1 (Carbon (IBM)) |
| `divider` | 1 (MUI (Material UI)) |
| `orientation` | 1 (Carbon (IBM)) |
| `padding` | 1 (Primer (GitHub)) |
| `spacing` | 1 (MUI (Material UI)) |
| `useFlexGap` | 1 (MUI (Material UI)) |
| `vertical` | 1 (Ant Design) |

**Design choices observed:**

- Flexbox shorthand wrapper — _Ant Design_
- Direct flexbox API exposure with tokens. — _Atlassian Design System_
- Token-driven flex stack. — _Carbon (IBM)_
- Flex-wrap container with even gaps — _Chakra UI_
- Flex one-dimensional layout with dividers — _MUI (Material UI)_
- Vertical flex layout — _Mantine_
- Responsive token-driven flex primitive. — _Primer (GitHub)_
- Style-prop flexbox primitive with token-aware spacing — _React Spectrum (Adobe)_
- Z-stacks children at same position; stack class with stack-{top|bottom|start|end} — _daisyUI_

**Source URLs:**

- [Ant Design](https://ant.design/components/flex) — `Flex`
- [Atlassian Design System](https://atlassian.design/components/primitives/flex/examples) — `Flex`
- [Carbon (IBM)](https://github.com/carbon-design-system/carbon/tree/main/packages/react/src/components/Stack) — `Stack`
- [Chakra UI](https://chakra-ui.com/docs/components/wrap) — `Wrap`
- [MUI (Material UI)](https://mui.com/material-ui/react-stack/) — `Stack`
- [Mantine](https://mantine.dev/core/stack/) — `Stack`
- [Primer (GitHub)](https://primer.style/components/stack) — `Stack`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Flex.html) — `Flex`
- [daisyUI](https://daisyui.com/components/stack/) — `Stack`

---

### CodeBlock

**Systems including:** 7  |  **Lens:** doc  |  **Teseor:** shipped

**Category mix:** composite×3, primitive×3, complex×1

**Aliases observed:** `Code Block`, `Code Block (diff)`, `Code Block (errors & warnings)`, `Code Block (focus)`, `Code Block (line highlighting)`, `Code Group`, `Code block (pre > code)`, `CodeBlock`, `CodeGroup`, `Live Code Block`, `prose pre`, `prose-pre`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `children` | 1 (Mintlify) |
| `code` | 1 (Chakra UI) |
| `defaultLanguage` | 1 (Tiptap) |
| `dropdown` | 1 (Mintlify) |
| `exitOnTripleEnter` | 1 (Tiptap) |
| `HTMLAttributes` | 1 (Tiptap) |
| `labels` | 1 (VitePress) |
| `language` | 1 (Chakra UI) |
| `languageClassPrefix` | 1 (Tiptap) |
| `live` | 1 (Docusaurus) |
| `noInline` | 1 (Docusaurus) |
| `showLineNumbers` | 1 (Chakra UI) |

**A11y / ARIA observations:**

- Copy button labeled; pre/code semantics — _Chakra UI_
- Editor surface; uses React Live; no specific ARIA documented. — _Docusaurus_
- Not documented — _Mintlify_
- No ARIA impact — _Tailwind Typography (prose plugin)_
- Maps to \<pre\>\<code\> — _Tiptap_
- Tab-style nav; specific ARIA roles handled by theme. — _VitePress_

**Design choices observed:**

- Composite CodeBlock.Root + Content + CopyTrigger — _Chakra UI_
- Opt-in via @docusaurus/theme-live-codeblock; live metastring switches the code fence into an interactive React Live editor. — _Docusaurus_
- Wraps multiple code fences; tab labels driven by filename in fence; auto-syncs with same-page Tabs — _Mintlify_
- Element modifier targeting preformatted code blocks — _Tailwind Typography (prose plugin)_
- No syntax highlighting; pair with CodeBlockLowlight for that — _Tiptap_
- preformatted block with width matched to body column — _Tufte CSS_
- ::: code-group container wrapping fenced code blocks with \[label\] info-string labels into a tabbed switcher. — _VitePress_

**Source URLs:**

- [Chakra UI](https://chakra-ui.com/docs/components/code-block) — `Code Block`
- [Docusaurus](https://docusaurus.io/docs/markdown-features/code-blocks) — `Live Code Block`
- [Mintlify](https://mintlify.com/docs/components/code-groups) — `CodeGroup`
- [Tailwind Typography (prose plugin)](https://github.com/tailwindlabs/tailwindcss-typography) — `prose-pre`
- [Tiptap](https://tiptap.dev/docs/editor/extensions/nodes/code-block) — `CodeBlock`
- [Tufte CSS](https://edwardtufte.github.io/tufte-css/) — `Code block (pre > code)`
- [VitePress](https://vitepress.dev/guide/markdown#code-groups) — `Code Group`

---

### Group

**Systems including:** 6  |  **Lens:** both  |  **Teseor:** shipped-as-cluster

**Category mix:** layout×5, composite×1

**Aliases observed:** `Group`, `Group (input group)`, `Inline`, `group`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `grow` | 2 (Chakra UI, Mantine) |
| `align` | 1 (Mantine) |
| `alignBlock` | 1 (Atlassian Design System) |
| `alignInline` | 1 (Atlassian Design System) |
| `attached` | 1 (Chakra UI) |
| `gap` | 1 (Mantine) |
| `isDisabled` | 1 (React Aria Components) |
| `isInvalid` | 1 (React Aria Components) |
| `justify` | 1 (Mantine) |
| `label` | 1 (FormKit) |
| `name` | 1 (FormKit) |
| `orientation` | 1 (Chakra UI) |
| `role` | 1 (React Aria Components) |
| `role=group` | 1 (Pico.css) |
| `shouldWrap` | 1 (Atlassian Design System) |
| `space` | 1 (Atlassian Design System) |
| `spread` | 1 (Atlassian Design System) |
| `v-model` | 1 (FormKit) |
| `wrap` | 1 (Mantine) |

**A11y / ARIA observations:**

- Renders no DOM (structural only) — _FormKit_
- role=group joins adjacent inputs/buttons — _Pico.css_
- Grouping container with optional role=group/region — _React Aria Components_

**Design choices observed:**

- Horizontal layout primitive. — _Atlassian Design System_
- Visual grouping for adjacent controls (input+button) — _Chakra UI_
- Nests child values into a sub-object in form data; pure data-structural — _FormKit_
- Horizontal Stack-like flex wrapper — _Mantine_
- attribute-based input group via role=group — _Pico.css_
- Generic primitive for grouping form controls — _React Aria Components_

**Source URLs:**

- [Atlassian Design System](https://atlassian.design/components/primitives/inline/examples) — `Inline`
- [Chakra UI](https://chakra-ui.com/docs/components/group) — `Group`
- [FormKit](https://formkit.com/inputs/group) — `group`
- [Mantine](https://mantine.dev/core/group/) — `Group`
- [Pico.css](https://picocss.com/docs/group) — `Group (input group)`
- [React Aria Components](https://react-aria.adobe.com/Group) — `Group`

---

## P1 — Doc-blocking or dual-use

36 components.

### Table

**Systems including:** 24  |  **Lens:** doc  |  **Teseor:** missing

**Category mix:** complex×11, composite×7, primitive×5, layout×1

**Aliases observed:** `Table`, `Tables (UI Blocks)`, `prose table`, `prose tbody`, `prose td`, `prose th`, `prose thead`, `prose tr`, `prose-table`, `prose-td`, `prose-th`, `prose-thead` (+1 more)

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `size` | 3 (Chakra UI, Fluent UI React (v9 / Fluent 2), MUI (Material UI)) |
| `columns` | 2 (Ant Design, BaseWeb (Uber)) |
| `data` | 2 (BaseWeb (Uber), Mantine) |
| `onSortChange` | 2 (HeroUI, React Aria Components) |
| `selectionMode` | 2 (HeroUI, React Aria Components) |
| `sortDescriptor` | 2 (HeroUI, React Aria Components) |
| `stickyHeader` | 2 (Chakra UI, MUI (Material UI)) |
| `striped` | 2 (Catalyst (Tailwind Labs), Mantine) |
| `allowsDragging` | 1 (React Aria Components) |
| `as` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `bleed` | 1 (Catalyst (Tailwind Labs)) |
| `bottomContent` | 1 (HeroUI) |
| `captionSide` | 1 (Mantine) |
| `cellMinWidth` | 1 (Tiptap) |
| `className` | 1 (shadcn/ui) |
| `dataSource` | 1 (Ant Design) |
| `dense` | 1 (Catalyst (Tailwind Labs)) |
| `dragAndDropHooks` | 1 (React Aria Components) |
| `emptyMessage` | 1 (BaseWeb (Uber)) |
| `expandable` | 1 (Ant Design) |
| `getFooterGroups()` | 1 (TanStack Table) |
| `getHeaderGroups()` | 1 (TanStack Table) |
| `getRowModel()` | 1 (TanStack Table) |
| `getState()` | 1 (TanStack Table) |
| `grid` | 1 (Catalyst (Tailwind Labs)) |
| `handleWidth` | 1 (Tiptap) |
| `highlightOnHover` | 1 (Mantine) |
| `horizontalScrollWidth` | 1 (BaseWeb (Uber)) |
| `HTMLAttributes` | 1 (Tiptap) |
| `interactive` | 1 (Chakra UI) |
| `isFixedSize` | 1 (Atlassian Design System) |
| `isHighlighted` | 1 (Atlassian Design System) |
| `lastColumnResizable` | 1 (Tiptap) |
| `loading` | 1 (BaseWeb (Uber)) |
| `noNativeElements` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `onSelectionChange` | 1 (HeroUI) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `padding` | 1 (MUI (Material UI)) |
| `pagination` | 1 (Ant Design) |
| `reset()` | 1 (TanStack Table) |
| _… +13 more props_ | |

**A11y / ARIA observations:**

- uses native table semantics — _MVP.css, Sakura.css, Simple.css +2 more_
- Native table semantics — _Catalyst (Tailwind Labs), Tailwind Plus UI Blocks, daisyUI, shadcn/ui_
- Native table semantics; aria-sort on sortable headers — _Ant Design_
- Native table semantics. — _Atlassian Design System_
- Renders semantic table with thead/tbody — _BaseWeb (Uber)_
- Semantic table elements — _Chakra UI_
- Renders semantic table or role=grid when noNativeElements — _Fluent UI React (v9 / Fluent 2)_
- React Aria Table: grid roles; aria-sort on sortable headers — _HeroUI_
- Native table semantics; TableSortLabel sets aria-sort — _MUI (Material UI)_
- Native table semantics; ScrollContainer wraps for overflow — _Mantine_
- Renders semantic \<table\>/\<thead\>/\<tbody\>/\<th\>/\<td\>; inherits standard table semantics. — _Nextra_
- role=grid switches to striped grid variant; uses native thead/tbody/tfoot — _Pico.css_
- WAI-ARIA grid with row/column headers, sortable column announcements, range selection — _React Aria Components_
- No ARIA impact — _Tailwind Typography (prose plugin)_
- Renders \<table\>; row/cell roles inherited — _Tiptap_
- uses native table semantics with caption support — _awsm.css_

**Design choices observed:**

- Columns + dataSource model; built-in sort/filter/pagination/rowSelection/expand/virtual — _Ant Design_
- Styled native \<table\> for simple cases. — _Atlassian Design System_
- Lightweight semantic table; sibling of DataTable (virtualized) — _BaseWeb (Uber)_
- Table + TableHead + TableBody + TableRow + TableHeader + TableCell with bleed/striped/dense modifiers — _Catalyst (Tailwind Labs)_
- Composite Table.Root + Header/Body/Row/Cell/ColumnHeader; no data orchestration — _Chakra UI_
- Table + TableHeader/Row/Cell + selection + sort headless hooks (useTableFeatures) — _Fluent UI React (v9 / Fluent 2)_
- Composite Table + TableHeader/Column + TableBody/Row/Cell; selection + sort + async loading — _HeroUI_
- Composite Table + Head/Body/Row/Cell/Pagination/SortLabel; styled (no virtualization) — _MUI (Material UI)_
- classless table with thead/tr/th/td styling — _MVP.css_
- Data-prop shorthand or composite Table.Thead/Tbody/Tr/Td/ScrollContainer — _Mantine_
- JSX alternative to Markdown tables; exposes Table.Tr/Table.Th/Table.Td sub-components. — _Nextra_
- classless table; role=grid for striped variant — _Pico.css_
- Part-based (Table/TableHeader/Column/TableBody/Row/Cell/ColumnResizer/ResizableTableContainer); collection-driven; DnD + resize — _React Aria Components_
- classless table with th/td padding and underline — _Sakura.css_
- alternating row highlight; figure wrapper for wide tables — _Simple.css_
- 19 table block variants (markup only, no Data Table behavior) — _Tailwind Plus UI Blocks_
- Element modifier targeting table data cells — _Tailwind Typography (prose plugin)_
- Headless table instance — no DOM — _TanStack Table_
- Pairs with TableRow/TableCell/TableHeader — _Tiptap_
- classless table with thead/tbody/tr/th/td styling — _Water.css_
- classless table with caption, th, first/last/only-child cell padding — _awsm.css_
- Class API on native table: table + table-{zebra|pin-rows|pin-cols} + table-{xs..xl} — _daisyUI_
- classless table with tr/th/td styling — _new.css_
- Styled native table elements: Table/Header/Body/Footer/Row/Head/Cell/Caption — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/table) — `Table`
- [Atlassian Design System](https://atlassian.design/components/table/examples) — `Table`
- [BaseWeb (Uber)](https://baseweb.design/components/table/) — `Table`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/table) — `Table`
- [Chakra UI](https://chakra-ui.com/docs/components/table) — `Table`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-table--docs) — `Table`
- [HeroUI](https://heroui.com/en/docs/react/components/table) — `Table`
- [MUI (Material UI)](https://mui.com/material-ui/react-table/) — `Table`
- [MVP.css](https://andybrewer.github.io/mvp/) — `Table`
- [Mantine](https://mantine.dev/core/table/) — `Table`
- [Nextra](https://nextra.site/docs/built-ins/table) — `Table`
- [Pico.css](https://picocss.com/docs/table) — `Table`
- [React Aria Components](https://react-aria.adobe.com/Table) — `Table`
- [Sakura.css](https://github.com/oxalorg/sakura/blob/master/css/sakura.css) — `Table`
- [Simple.css](https://simplecss.org/demo) — `Table`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/lists/tables) — `Tables (UI Blocks)`
- [Tailwind Typography (prose plugin)](https://github.com/tailwindlabs/tailwindcss-typography) — `prose-td`
- [TanStack Table](https://tanstack.com/table/latest/docs/api/core/table) — `Table`
- [Tiptap](https://tiptap.dev/docs/editor/extensions/nodes/table) — `Table`
- [Water.css](https://watercss.kognise.dev/) — `Table`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Table`
- [daisyUI](https://daisyui.com/components/table/) — `Table`
- [new.css](https://newcss.net/demo/) — `Table`
- [shadcn/ui](https://ui.shadcn.com/docs/components/table) — `Table`

---

### Link

**Systems including:** 22  |  **Lens:** doc  |  **Teseor:** missing

**Category:** primitive (all 22 systems)

**Aliases observed:** `Link`, `Link (a)`, `NavLink`, `Skip Nav`, `prose a`, `prose-a`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `href` | 13 (Atlassian Design System, BaseWeb (Uber), HeroUI, MUI (Material UI) +9 more) |
| `target` | 3 (Atlassian Design System, Polaris (Shopify), React Aria Components) |
| `underline` | 3 (HeroUI, MUI (Material UI), Primer (GitHub)) |
| `appearance` | 2 (Atlassian Design System, Fluent UI React (v9 / Fluent 2)) |
| `color` | 2 (HeroUI, MUI (Material UI)) |
| `disabled` | 2 (Carbon (IBM), Fluent UI React (v9 / Fluent 2)) |
| `inline` | 2 (Carbon (IBM), Fluent UI React (v9 / Fluent 2)) |
| `label` | 2 (Chakra UI, Mantine) |
| `onPress` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `size` | 2 (Carbon (IBM), HeroUI) |
| `variant` | 2 (MUI (Material UI), React Spectrum (Adobe)) |
| `active` | 1 (Mantine) |
| `animateUnderline` | 1 (BaseWeb (Uber)) |
| `as` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `autolink` | 1 (Tiptap) |
| `childrenOffset` | 1 (Mantine) |
| `class` | 1 (Simple.css) |
| `component` | 1 (MUI (Material UI)) |
| `disabledFocusable` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `external` | 1 (Polaris (Shopify)) |
| `hoverColor` | 1 (Primer (GitHub)) |
| `HTMLAttributes` | 1 (Tiptap) |
| `id` | 1 (Chakra UI) |
| `isDisabled` | 1 (React Aria Components) |
| `isExternal` | 1 (HeroUI) |
| `isQuiet` | 1 (React Spectrum (Adobe)) |
| `leftSection` | 1 (Mantine) |
| `linkOnPaste` | 1 (Tiptap) |
| `monochrome` | 1 (Polaris (Shopify)) |
| `muted` | 1 (Primer (GitHub)) |
| `onClick` | 1 (Atlassian Design System) |
| `openOnClick` | 1 (Tiptap) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `protocols` | 1 (Tiptap) |
| `removeUnderline` | 1 (Polaris (Shopify)) |
| `renderIcon` | 1 (Carbon (IBM)) |
| `rightSection` | 1 (Mantine) |
| `role` | 1 (Pico.css) |
| `showAnchorIcon` | 1 (HeroUI) |
| `url` | 1 (Polaris (Shopify)) |
| _… +1 more props_ | |

**A11y / ARIA observations:**

- native link semantics — _Simple.css, Tufte CSS, new.css_
- Anchor semantics. — _Carbon (IBM), Primer (GitHub)_
- Anchor semantics; rel handled for new tab. — _Atlassian Design System_
- Native anchor; theme respects focus ring — _BaseWeb (Uber)_
- Skip link visible on focus — _Chakra UI_
- Anchor element with focus ring; supports as='button' — _Fluent UI React (v9 / Fluent 2)_
- React Aria Link; rel=noopener for external — _HeroUI_
- Native anchor; underline=hover|always|none — _MUI (Material UI)_
- Renders anchor or button; aria-current=page when active — _Mantine_
- role=button promotes link to button styling — _Pico.css_
- External link annotated with sr-only text. — _Polaris (Shopify)_
- Native link semantics with usePress; disabled state via aria-disabled — _React Aria Components_
- Anchor element with focus ring — _React Spectrum (Adobe)_
- native link semantics with visited/hover states — _Sakura.css_
- No ARIA impact — _Tailwind Typography (prose plugin)_
- Maps to \<a\> — _Tiptap_
- native link semantics, visited/hover states styled — _Water.css_
- native link semantics with visited/hover/active states — _awsm.css_
- Native anchor semantics — _daisyUI_

**Design choices observed:**

- Routed via @atlaskit/link router context. — _Atlassian Design System_
- Anchor primitive with animated underline option — _BaseWeb (Uber)_
- Inline vs standalone variants. — _Carbon (IBM)_
- Composite SkipNavLink + SkipNavContent — _Chakra UI_
- Polymorphic anchor/button with subtle/default appearance — _Fluent UI React (v9 / Fluent 2)_
- Variants and underline modes; built-in external indicator — _HeroUI_
- Theme-aware anchor — _MUI (Material UI)_
- Sidebar nav item with nested child links — _Mantine_
- classless tag styling, secondary/contrast class modifiers — _Pico.css_
- Anchor wrapper with router-friendly LinkComponent. — _Polaris (Shopify)_
- Theme-tone props. — _Primer (GitHub)_
- Polymorphic; render-prop pressed/hovered/focused state — _React Aria Components_
- Either renders anchor or wraps child router link — _React Spectrum (Adobe)_
- duotone accent-color link — _Sakura.css_
- .button class promotes link to button styling — _Simple.css_
- Element modifier targeting anchor links — _Tailwind Typography (prose plugin)_
- Autolink + paste detection; configurable protocol allowlist — _Tiptap_
- background-image underline that respects descenders — _Tufte CSS_
- classless underlined link — _Water.css_
- accent underlined link — _awsm.css_
- link + link-hover + link-{color} — _daisyUI_
- classless link; wrapping a around button styles as button — _new.css_

**Source URLs:**

- [Atlassian Design System](https://atlassian.design/components/link/examples) — `Link`
- [BaseWeb (Uber)](https://baseweb.design/components/link/) — `Link`
- [Carbon (IBM)](https://carbondesignsystem.com/components/link/usage/) — `Link`
- [Chakra UI](https://chakra-ui.com/docs/components/skip-nav) — `Skip Nav`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-link--docs) — `Link`
- [HeroUI](https://heroui.com/en/docs/react/components/link) — `Link`
- [MUI (Material UI)](https://mui.com/material-ui/react-link/) — `Link`
- [Mantine](https://mantine.dev/core/nav-link/) — `NavLink`
- [Pico.css](https://picocss.com/docs/link) — `Link (a)`
- [Polaris (Shopify)](https://polaris.shopify.com/components/navigation/link) — `Link`
- [Primer (GitHub)](https://primer.style/components/link) — `Link`
- [React Aria Components](https://react-aria.adobe.com/Link) — `Link`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Link.html) — `Link`
- [Sakura.css](https://github.com/oxalorg/sakura/blob/master/css/sakura.css) — `Link (a)`
- [Simple.css](https://simplecss.org/demo) — `Link (a)`
- [Tailwind Typography (prose plugin)](https://github.com/tailwindlabs/tailwindcss-typography) — `prose-a`
- [Tiptap](https://tiptap.dev/docs/editor/extensions/marks/link) — `Link`
- [Tufte CSS](https://edwardtufte.github.io/tufte-css/) — `Link (a)`
- [Water.css](https://watercss.kognise.dev/) — `Link (a)`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Link (a)`
- [daisyUI](https://daisyui.com/components/link/) — `Link`
- [new.css](https://newcss.net/usage/elements/) — `Link (a)`

---

### ProgressBar

**Systems including:** 21  |  **Lens:** both  |  **Teseor:** missing

**Category:** primitive (all 21 systems)

**Aliases observed:** `Progress`, `Progress - Linear`, `Progress Bar`, `Progress Bars`, `Progress bar`, `ProgressBar`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `value` | 15 (Ark UI, Atlassian Design System, Base UI, BaseWeb (Uber) +11 more) |
| `max` | 8 (Ark UI, Base UI, Carbon (IBM), Chakra UI +4 more) |
| `color` | 4 (Fluent UI React (v9 / Fluent 2), HeroUI, MUI (Material UI), Mantine) |
| `isIndeterminate` | 4 (Atlassian Design System, HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `maxValue` | 4 (BaseWeb (Uber), HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `minValue` | 4 (BaseWeb (Uber), HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `size` | 4 (Carbon (IBM), MUI (Material UI), Mantine, Polaris (Shopify)) |
| `min` | 3 (Ark UI, Base UI, Chakra UI) |
| `animated` | 2 (Mantine, Polaris (Shopify)) |
| `label` | 2 (Carbon (IBM), HeroUI) |
| `progress` | 2 (Polaris (Shopify), Primer (GitHub)) |
| `shape` | 2 (Chakra UI, Fluent UI React (v9 / Fluent 2)) |
| `showValueLabel` | 2 (HeroUI, React Spectrum (Adobe)) |
| `status` | 2 (Ant Design, Carbon (IBM)) |
| `thickness` | 2 (Fluent UI React (v9 / Fluent 2), MUI (Material UI)) |
| `variant` | 2 (MUI (Material UI), React Spectrum (Adobe)) |
| `appearance` | 1 (Atlassian Design System) |
| `ariaLabel` | 1 (Atlassian Design System) |
| `asChild` | 1 (Radix UI Primitives) |
| `barSize` | 1 (Primer (GitHub)) |
| `bg` | 1 (Primer (GitHub)) |
| `format` | 1 (Base UI) |
| `formatOptions` | 1 (React Aria Components) |
| `getValueLabel` | 1 (Radix UI Primitives) |
| `indeterminate` | 1 (Chakra UI) |
| `infinite` | 1 (BaseWeb (Uber)) |
| `inline` | 1 (Primer (GitHub)) |
| `orientation` | 1 (Ark UI) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `percent` | 1 (Ant Design) |
| `showInfo` | 1 (Ant Design) |
| `showLabel` | 1 (BaseWeb (Uber)) |
| `steps` | 1 (Ant Design) |
| `striped` | 1 (Mantine) |
| `strokeColor` | 1 (Ant Design) |
| `successValue` | 1 (BaseWeb (Uber)) |
| `tone` | 1 (Polaris (Shopify)) |
| `translations` | 1 (Ark UI) |
| `type` | 1 (Ant Design) |

**A11y / ARIA observations:**

- WAI-ARIA progressbar with announced label/value — _Base UI, React Aria Components_
- role=progressbar — _Chakra UI, Mantine_
- role=progressbar with aria-valuenow. — _Polaris (Shopify), Primer (GitHub)_
- role=progressbar; aria-valuenow — _Ant Design_
- WAI-ARIA progressbar; determinate/indeterminate — _Ark UI_
- role=progressbar with aria-valuenow; indeterminate handled. — _Atlassian Design System_
- role=progressbar with aria-valuenow/min/max; infinite drops valuenow — _BaseWeb (Uber)_
- role=progressbar with aria-valuenow/min/max on .progress-bar — _Bootstrap_
- role=progressbar with aria-valuenow/max. — _Carbon (IBM)_
- role=progressbar with aria-valuenow/min/max; indeterminate omits valuenow — _Fluent UI React (v9 / Fluent 2)_
- React Aria ProgressBar: role=progressbar with aria-valuetext — _HeroUI_
- role=progressbar; aria-valuenow/min/max — _MUI (Material UI)_
- native progressbar semantics; indeterminate without value — _Pico.css_
- role=progressbar with aria-valuenow/min/max and value label — _Radix UI Primitives_
- role=progressbar with aria-valuenow/min/max — _React Spectrum (Adobe)_
- role="progressbar" with aria-valuenow — _Tailwind Plus UI Blocks_
- Native \<progress\> semantics: aria-valuenow built in — _daisyUI_
- Radix primitive: role="progressbar", aria-valuenow/min/max — _shadcn/ui_

**Design choices observed:**

- type=line|circle|dashboard; steps mode — _Ant Design_
- Part-based (Root/Label/Track/Range/ValueText/View) — _Ark UI_
- Determinate + indeterminate; success/danger appearance. — _Atlassian Design System_
- Part-based (Root/Label/Value/Track/Indicator); supports indeterminate — _Base UI_
- Single bar with optional label and infinite mode — _BaseWeb (Uber)_
- .progress + .progress-bar; stacked, striped, animated modifiers; .progress-stacked — _Bootstrap_
- Determinate + indeterminate; status icons. — _Carbon (IBM)_
- Composite Progress.\* parts; linear shape — _Chakra UI_
- Determinate/indeterminate; brand/success/warning/error color set — _Fluent UI React (v9 / Fluent 2)_
- Determinate/indeterminate linear progress — _HeroUI_
- Linear and Circular variants; determinate/indeterminate — _MUI (Material UI)_
- Composite Progress + Progress.Root/Section/Label for stacked — _Mantine_
- classless styled native progress with indeterminate animation — _Pico.css_
- Determinate only. — _Polaris (Shopify)_
- Multi-segment via child Item components. — _Primer (GitHub)_
- Part-based (Root/Indicator); data-state attrs for indeterminate/loading/complete — _Radix UI Primitives_
- Part-based (ProgressBar/Label); determinate or indeterminate — _React Aria Components_
- Bar variant with static/indeterminate states — _React Spectrum (Adobe)_
- 8 progress-indicator variants — _Tailwind Plus UI Blocks_
- Class on native \<progress\>: progress + progress-{color} — _daisyUI_
- Radix-based — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/progress) — `Progress`
- [Ark UI](https://ark-ui.com/docs/components/progress-linear) — `Progress - Linear`
- [Atlassian Design System](https://atlassian.design/components/progress-bar/examples) — `Progress bar`
- [Base UI](https://base-ui.com/react/components/progress) — `Progress`
- [BaseWeb (Uber)](https://baseweb.design/components/progress-bar/) — `ProgressBar`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/progress/) — `Progress`
- [Carbon (IBM)](https://carbondesignsystem.com/components/progress-bar/usage/) — `ProgressBar`
- [Chakra UI](https://chakra-ui.com/docs/components/progress) — `Progress`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-progressbar--docs) — `ProgressBar`
- [HeroUI](https://heroui.com/en/docs/react/components/progress-bar) — `Progress Bar`
- [MUI (Material UI)](https://mui.com/material-ui/react-progress/) — `Progress`
- [Mantine](https://mantine.dev/core/progress/) — `Progress`
- [Pico.css](https://picocss.com/docs/progress) — `Progress`
- [Polaris (Shopify)](https://polaris.shopify.com/components/feedback-indicators/progress-bar) — `Progress bar`
- [Primer (GitHub)](https://primer.style/components/progress-bar) — `ProgressBar`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/progress) — `Progress`
- [React Aria Components](https://react-aria.adobe.com/ProgressBar) — `ProgressBar`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/ProgressBar.html) — `ProgressBar`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/navigation/progress-bars) — `Progress Bars`
- [daisyUI](https://daisyui.com/components/progress/) — `Progress`
- [shadcn/ui](https://ui.shadcn.com/docs/components/progress) — `Progress`

---

### Badge

**Systems including:** 18  |  **Lens:** both  |  **Teseor:** missing

**Category:** primitive (all 18 systems)

**Aliases observed:** `Badge`, `Badges (UI Blocks)`, `Chip`, `Pill`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `color` | 8 (Ant Design, BaseWeb (Uber), Catalyst (Tailwind Labs), Fluent UI React (v9 / Fluent 2) +4 more) |
| `size` | 7 (Astro Starlight, Chakra UI, Fluent UI React (v9 / Fluent 2), HeroUI +3 more) |
| `variant` | 7 (Astro Starlight, Chakra UI, HeroUI, MUI (Material UI) +3 more) |
| `icon` | 4 (Fluent UI React (v9 / Fluent 2), MUI (Material UI), Mintlify, Polaris (Shopify)) |
| `shape` | 3 (BaseWeb (Uber), Fluent UI React (v9 / Fluent 2), Mintlify) |
| `appearance` | 2 (Atlassian Design System, Fluent UI React (v9 / Fluent 2)) |
| `children` | 2 (Atlassian Design System, React Spectrum (Adobe)) |
| `className` | 2 (Catalyst (Tailwind Labs), shadcn/ui) |
| `text` | 2 (Astro Starlight, VitePress) |
| `asChild` | 1 (shadcn/ui) |
| `avatar` | 1 (MUI (Material UI)) |
| `colorPalette` | 1 (Chakra UI) |
| `content` | 1 (BaseWeb (Uber)) |
| `count` | 1 (Ant Design) |
| `disabled` | 1 (Mintlify) |
| `dot` | 1 (Ant Design) |
| `endContent` | 1 (HeroUI) |
| `hierarchy` | 1 (BaseWeb (Uber)) |
| `iconPosition` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `label` | 1 (MUI (Material UI)) |
| `leftSection` | 1 (Mantine) |
| `max` | 1 (Atlassian Design System) |
| `offset` | 1 (Ant Design) |
| `onClick` | 1 (MUI (Material UI)) |
| `onClose` | 1 (HeroUI) |
| `onDelete` | 1 (MUI (Material UI)) |
| `overflowCount` | 1 (Ant Design) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `progress` | 1 (Polaris (Shopify)) |
| `radius` | 1 (HeroUI) |
| `rightSection` | 1 (Mantine) |
| `startContent` | 1 (HeroUI) |
| `status` | 1 (Ant Design) |
| `stroke` | 1 (Mintlify) |
| `tone` | 1 (Polaris (Shopify)) |
| `type` | 1 (VitePress) |

**A11y / ARIA observations:**

- Visible content for AT — _Ant Design_
- Inline label; passes through span attributes — _Astro Starlight_
- Numeric value announced via sr-only. — _Atlassian Design System_
- Decorative by default; consumer supplies aria-label when needed — _BaseWeb (Uber)_
- Visually hidden context text recommended — _Bootstrap_
- Decorative by default; consumer adds aria-label when standalone — _Fluent UI React (v9 / Fluent 2)_
- Close button labeled when onClose set — _HeroUI_
- Button role when interactive; delete icon labeled — _MUI (Material UI)_
- Inline status indicator; no explicit ARIA documented — _Mintlify_
- Status conveyed via tone + text. — _Polaris (Shopify)_
- Decorative; consumer labels via context when needed — _React Spectrum (Adobe)_
- Inline label; no explicit ARIA. — _VitePress_

**Design choices observed:**

- Composite Badge + Badge.Ribbon — _Ant Design_
- Variant-driven color (note/tip/danger/caution/success/default), 3 sizes — _Astro Starlight_
- Numeric tally pill with max threshold. — _Atlassian Design System_
- Styled span; HINT/Badge/NotificationCircle variants — _BaseWeb (Uber)_
- .badge with bg-\* utilities; .text-bg-\* shortcut — _Bootstrap_
- Single span; 20 named color tokens — _Catalyst (Tailwind Labs)_
- Status pill variants — _Chakra UI_
- Filled/ghost/outline/tint appearances with semantic color set — _Fluent UI React (v9 / Fluent 2)_
- Variants solid/bordered/light/flat/faded/shadow/dot — _HeroUI_
- filled/outlined; deletable/clickable — _MUI (Material UI)_
- Pill/badge with sections — _Mantine_
- Inline MDX component with 11 colors, 4 sizes, filled/outline variants — _Mintlify_
- Status pill with progress dot variant. — _Polaris (Shopify)_
- Semantic colour token + icon support — _React Spectrum (Adobe)_
- 16 badge/pill variants — _Tailwind Plus UI Blocks_
- \<Badge\> Vue component for inline labels with type variants (info, tip, warning, danger). — _VitePress_
- Class API: badge + badge-{color} + badge-{outline|dash|soft|ghost} + badge-{xs..xl} — _daisyUI_
- CVA-variant span; asChild slot to render as link — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/badge) — `Badge`
- [Astro Starlight](https://starlight.astro.build/components/badges/) — `Badge`
- [Atlassian Design System](https://atlassian.design/components/badge/examples) — `Badge`
- [BaseWeb (Uber)](https://baseweb.design/components/badge/) — `Badge`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/badge/) — `Badge`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/badge) — `Badge`
- [Chakra UI](https://chakra-ui.com/docs/components/badge) — `Badge`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-badge-badge--docs) — `Badge`
- [HeroUI](https://heroui.com/en/docs/react/components/chip) — `Chip`
- [MUI (Material UI)](https://mui.com/material-ui/react-chip/) — `Chip`
- [Mantine](https://mantine.dev/core/badge/) — `Badge`
- [Mintlify](https://mintlify.com/docs/components/badge) — `Badge`
- [Polaris (Shopify)](https://polaris.shopify.com/components/feedback-indicators/badge) — `Badge`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Badge.html) — `Badge`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/elements/badges) — `Badges (UI Blocks)`
- [VitePress](https://vitepress.dev/reference/default-theme-badge) — `Badge`
- [daisyUI](https://daisyui.com/components/badge/) — `Badge`
- [shadcn/ui](https://ui.shadcn.com/docs/components/badge) — `Badge`

---

### Card

**Systems including:** 18  |  **Lens:** both  |  **Teseor:** missing

**Category mix:** composite×12, layout×5, complex×1

**Aliases observed:** `Card`, `Card (article)`, `Card / CardView`, `CardGroup`, `Cards`, `Cards.Card`, `Checkbox Card`, `Preview Card`, `Radio Card`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `title` | 4 (Ant Design, Astro Starlight, BaseWeb (Uber), Nextra) |
| `icon` | 2 (Astro Starlight, Nextra) |
| `onSelectionChange` | 2 (Fluent UI React (v9 / Fluent 2), React Spectrum (Adobe)) |
| `padding` | 2 (Mantine, Polaris (Shopify)) |
| `radius` | 2 (HeroUI, Mantine) |
| `shadow` | 2 (HeroUI, Mantine) |
| `size` | 2 (Chakra UI, Fluent UI React (v9 / Fluent 2)) |
| `variant` | 2 (Chakra UI, MUI (Material UI)) |
| `action` | 1 (BaseWeb (Uber)) |
| `actions` | 1 (Ant Design) |
| `appearance` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `arrow` | 1 (Nextra) |
| `background` | 1 (Polaris (Shopify)) |
| `bordered` | 1 (Ant Design) |
| `children` | 1 (Mintlify) |
| `className` | 1 (shadcn/ui) |
| `closeDelay` | 1 (Base UI) |
| `cols` | 1 (Mintlify) |
| `cover` | 1 (Ant Design) |
| `defaultOpen` | 1 (Base UI) |
| `delay` | 1 (Base UI) |
| `extra` | 1 (Ant Design) |
| `focusMode` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `headerImage` | 1 (BaseWeb (Uber)) |
| `hoverable` | 1 (Ant Design) |
| `href` | 1 (Nextra) |
| `image` | 1 (Nextra) |
| `isBlurred` | 1 (HeroUI) |
| `isHoverable` | 1 (HeroUI) |
| `isPressable` | 1 (HeroUI) |
| `items` | 1 (React Spectrum (Adobe)) |
| `layout` | 1 (React Spectrum (Adobe)) |
| `onOpenChange` | 1 (Base UI) |
| `open` | 1 (Base UI) |
| `orientation` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `raised` | 1 (MUI (Material UI)) |
| `renderEmptyState` | 1 (React Spectrum (Adobe)) |
| `roundedAbove` | 1 (Polaris (Shopify)) |
| `selected` | 1 (Fluent UI React (v9 / Fluent 2)) |
| _… +4 more props_ | |

**A11y / ARIA observations:**

- Semantic article when used as such — _Ant Design_
- Title is required, serving as semantic label — _Astro Starlight_
- Hover-triggered preview; not keyboard-essential — _Base UI_
- No imposed role; header h-element when title — _BaseWeb (Uber)_
- Card group/article semantics; checkbox slot labelled for selection — _Fluent UI React (v9 / Fluent 2)_
- Pressable variant uses React Aria button semantics — _HeroUI_
- Semantic article when wrapping content — _MUI (Material UI)_
- Layout wrapper; semantics inherit from child Cards — _Mintlify_
- Anchor-wrapped card; arrow is decorative. — _Nextra_
- uses article semantics — _Pico.css_
- Grid pattern with aria-selected and keyboard navigation — _React Spectrum (Adobe)_

**Design choices observed:**

- Composite Card + Card.Meta + Card.Grid with built-in tabs — _Ant Design_
- Minimal: title + icon + Markdown body; non-linkable — _Astro Starlight_
- Part-based (Root/Trigger/Portal/Backdrop/Positioner/Popup/Arrow) — _Base UI_
- Card + StyledBody + StyledAction slots — _BaseWeb (Uber)_
- .card + .card-header/-body/-title/-text/-footer/-img-top; .card-group, .row-cols layouts — _Bootstrap_
- Composite Card.Root + Header + Body + Footer + Title + Description — _Chakra UI_
- Card + CardHeader/CardFooter/CardPreview slots; selectable variant with floating checkbox — _Fluent UI React (v9 / Fluent 2)_
- Composite Card + CardHeader + CardBody + CardFooter — _HeroUI_
- Composite Card + Header/Media/Content/Actions/ActionArea — _MUI (Material UI)_
- Composite Card + Card.Section for edge-to-edge content — _Mantine_
- Grid layout for Cards (legacy alias of Columns) — _Mintlify_
- Static sub-component of Cards; can stand alone. href makes the whole card a link, arrow toggles the directional indicator. — _Nextra_
- article tag styled as card with optional header/footer children — _Pico.css_
- Slot-friendly container; pairs with BlockStack/InlineStack for content. — _Polaris (Shopify)_
- Collection of Card items with grid/waterfall/gallery layouts — _React Spectrum (Adobe)_
- 10 card layout variants — _Tailwind Plus UI Blocks_
- card + card-body + card-title + card-actions; card-{side|compact|normal} + card-image-full — _daisyUI_
- Compositional parts: Card/Header/Title/Description/Content/Footer/Action — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/card) — `Card`
- [Astro Starlight](https://starlight.astro.build/components/cards/) — `Card`
- [Base UI](https://base-ui.com/react/components/preview-card) — `Preview Card`
- [BaseWeb (Uber)](https://baseweb.design/components/card/) — `Card`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/card/) — `Card`
- [Chakra UI](https://chakra-ui.com/docs/components/card) — `Card`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-card-card--docs) — `Card`
- [HeroUI](https://heroui.com/en/docs/react/components/card) — `Card`
- [MUI (Material UI)](https://mui.com/material-ui/react-card/) — `Card`
- [Mantine](https://mantine.dev/core/card/) — `Card`
- [Mintlify](https://mintlify.com/docs/components/cards) — `CardGroup`
- [Nextra](https://nextra.site/docs/built-ins/cards) — `Cards.Card`
- [Pico.css](https://picocss.com/docs/card) — `Card (article)`
- [Polaris (Shopify)](https://polaris.shopify.com/components/layout-and-structure/card) — `Card`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/CardView.html) — `Card / CardView`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/layout/cards) — `Cards`
- [daisyUI](https://daisyui.com/components/card/) — `Card`
- [shadcn/ui](https://ui.shadcn.com/docs/components/card) — `Card`

---

### List

**Systems including:** 18  |  **Lens:** doc  |  **Teseor:** missing

**Category mix:** primitive×12, composite×4, layout×2

**Aliases observed:** `List`, `List (ul, ol, li)`, `OrderedList`, `UnorderedList`, `list`, `prose li`, `prose ol`, `prose ul`, `prose-li`, `prose-ol`, `prose-ul`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `gap` | 2 (Chakra UI, Polaris (Shopify)) |
| `type` | 2 (Mantine, Polaris (Shopify)) |
| `artwork` | 1 (BaseWeb (Uber)) |
| `as` | 1 (Chakra UI) |
| `children` | 1 (BaseWeb (Uber)) |
| `dataSource` | 1 (Ant Design) |
| `dense` | 1 (MUI (Material UI)) |
| `disablePadding` | 1 (MUI (Material UI)) |
| `dynamic` | 1 (FormKit) |
| `endEnhancer` | 1 (BaseWeb (Uber)) |
| `footer` | 1 (Ant Design) |
| `grid` | 1 (Ant Design) |
| `header` | 1 (Ant Design) |
| `HTMLAttributes` | 1 (Tiptap) |
| `icon` | 1 (Mantine) |
| `isExpressive` | 1 (Carbon (IBM)) |
| `items` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `itemTypeName` | 1 (Tiptap) |
| `keepAttributes` | 1 (Tiptap) |
| `keepMarks` | 1 (Tiptap) |
| `loading` | 1 (Ant Design) |
| `marker` | 1 (Chakra UI) |
| `name` | 1 (FormKit) |
| `native` | 1 (Carbon (IBM)) |
| `navigationMode` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `nested` | 1 (Carbon (IBM)) |
| `onSelectionChange` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `pagination` | 1 (Ant Design) |
| `renderItem` | 1 (Ant Design) |
| `selectedItems` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `selectionMode` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `size` | 1 (Mantine) |
| `spacing` | 1 (Mantine) |
| `subheader` | 1 (MUI (Material UI)) |
| `sublist` | 1 (BaseWeb (Uber)) |
| `v-model` | 1 (FormKit) |
| `variant` | 1 (Chakra UI) |
| `withPadding` | 1 (Mantine) |

**A11y / ARIA observations:**

- ul/ol semantics — _Chakra UI, Mantine_
- Semantic ul/li; pagination nav — _Ant Design_
- Renders ul/li semantics; sublist marked role=list — _BaseWeb (Uber)_
- Native ul semantics. — _Carbon (IBM)_
- role=listbox/list with selection announcements — _Fluent UI React (v9 / Fluent 2)_
- Renders no DOM (structural only) — _FormKit_
- role=list with ListItem children — _MUI (Material UI)_
- Native ul/ol. — _Polaris (Shopify)_
- No ARIA impact — _Tailwind Typography (prose plugin)_
- Renders \<ol\> — _Tiptap_

**Design choices observed:**

- classless bullet/number list — _MVP.css, Sakura.css, Simple.css +2 more_
- Composite List + List.Item + List.Item.Meta with grid/pagination — _Ant Design_
- Menu-style list item with artwork/end enhancer slots — _BaseWeb (Uber)_
- Token-styled ul. — _Carbon (IBM)_
- Composite List.Root + Item with marker control — _Chakra UI_
- List + ListItem slot composition with optional checkbox/Persona renderers — _Fluent UI React (v9 / Fluent 2)_
- Nests child values into an array in form data; child names act as indices — _FormKit_
- Composite List + ListItem + ListItemButton + ListItemText/Icon/Avatar — _MUI (Material UI)_
- Composite List + List.Item — _Mantine_
- Bullet/number list with spacing token. — _Polaris (Shopify)_
- Element modifier targeting list items — _Tailwind Typography (prose plugin)_
- Pairs with ListItem — _Tiptap_
- classless bullet/number list; ul\>li\>details supported — _awsm.css_
- list + list-row + list-col-grow/wrap; flex-based list rows — _daisyUI_

**Source URLs:**

- [Ant Design](https://ant.design/components/list) — `List`
- [BaseWeb (Uber)](https://baseweb.design/components/list/) — `List`
- [Carbon (IBM)](https://github.com/carbon-design-system/carbon/tree/main/packages/react/src/components/UnorderedList) — `UnorderedList`
- [Chakra UI](https://chakra-ui.com/docs/components/list) — `List`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-list--docs) — `List`
- [FormKit](https://formkit.com/inputs/list) — `list`
- [MUI (Material UI)](https://mui.com/material-ui/react-list/) — `List`
- [MVP.css](https://andybrewer.github.io/mvp/) — `List (ul, ol, li)`
- [Mantine](https://mantine.dev/core/list/) — `List`
- [Polaris (Shopify)](https://polaris.shopify.com/components/lists/list) — `List`
- [Sakura.css](https://github.com/oxalorg/sakura/blob/master/css/sakura.css) — `List (ul, ol, li)`
- [Simple.css](https://simplecss.org/demo) — `List (ul, ol, li)`
- [Tailwind Typography (prose plugin)](https://github.com/tailwindlabs/tailwindcss-typography) — `prose-li`
- [Tiptap](https://tiptap.dev/docs/editor/extensions/nodes/ordered-list) — `OrderedList`
- [Water.css](https://watercss.kognise.dev/) — `List (ul, ol, li)`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `List (ul, ol, li)`
- [daisyUI](https://daisyui.com/components/list/) — `List`
- [new.css](https://newcss.net/demo/) — `List (ul, ol, li)`

---

### Alert

**Systems including:** 17  |  **Lens:** both  |  **Teseor:** missing

**Category mix:** primitive×11, composite×5, layout×1

**Aliases observed:** `Alert`, `Alerts`, `Banner`, `Banners`, `Inline message`, `InlineMessage`, `MessageBar`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `title` | 6 (Atlassian Design System, BaseWeb (Uber), Chakra UI, HeroUI, Mantine, Polaris (Shopify)) |
| `variant` | 6 (Chakra UI, HeroUI, MUI (Material UI), Mantine, Primer (GitHub), shadcn/ui) |
| `action` | 4 (Ant Design, BaseWeb (Uber), MUI (Material UI), Polaris (Shopify)) |
| `icon` | 4 (Chakra UI, MUI (Material UI), Mantine, Polaris (Shopify)) |
| `color` | 3 (HeroUI, Mantine, Mintlify) |
| `type` | 3 (Ant Design, Atlassian Design System, Mintlify) |
| `description` | 2 (Ant Design, HeroUI) |
| `dismissible` | 2 (Mintlify, Nextra) |
| `onClose` | 2 (Catalyst (Tailwind Labs), MUI (Material UI)) |
| `size` | 2 (Catalyst (Tailwind Labs), Primer (GitHub)) |
| `artwork` | 1 (BaseWeb (Uber)) |
| `banner` | 1 (Ant Design) |
| `className` | 1 (shadcn/ui) |
| `closable` | 1 (Ant Design) |
| `content` | 1 (Mintlify) |
| `hierarchy` | 1 (BaseWeb (Uber)) |
| `iconLabel` | 1 (Atlassian Design System) |
| `intent` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `isClosable` | 1 (HeroUI) |
| `kind` | 1 (BaseWeb (Uber)) |
| `layout` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `message` | 1 (Ant Design) |
| `onDismiss` | 1 (Polaris (Shopify)) |
| `open` | 1 (Catalyst (Tailwind Labs)) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `placement` | 1 (Atlassian Design System) |
| `politeness` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `secondaryAction` | 1 (Polaris (Shopify)) |
| `severity` | 1 (MUI (Material UI)) |
| `shape` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `showIcon` | 1 (Ant Design) |
| `status` | 1 (Chakra UI) |
| `storageKey` | 1 (Nextra) |
| `tone` | 1 (Polaris (Shopify)) |
| `withCloseButton` | 1 (Mantine) |

**A11y / ARIA observations:**

- role=alert — _Ant Design, Mantine_
- role="alert" — _Tailwind Plus UI Blocks, shadcn/ui_
- Popup labelled by type icon. — _Atlassian Design System_
- Renders role=alert/status per kind — _BaseWeb (Uber)_
- role=alert; dismiss button labeled — _Bootstrap_
- Extends Headless UI Dialog for non-blocking alerts — _Catalyst (Tailwind Labs)_
- role=alert; status maps to icon/colorPalette — _Chakra UI_
- role=status/alert per politeness; close button labelled — _Fluent UI React (v9 / Fluent 2)_
- role=alert; close button labeled — _HeroUI_
- role=alert; icon decorative — _MUI (Material UI)_
- Site-wide announcement; dismissed state persists until content updates — _Mintlify_
- Dismiss button; no explicit ARIA documented. — _Nextra_
- role=status or role=alert based on tone. — _Polaris (Shopify)_
- Live region announces variant. — _Primer (GitHub)_
- role="alert" expected on element — _daisyUI_

**Design choices observed:**

- Composite Alert + Alert.ErrorBoundary — _Ant Design_
- Icon trigger that opens descriptive popup. — _Atlassian Design System_
- Banner + ActionButton + Artwork slots — _BaseWeb (Uber)_
- .alert + contextual color modifiers; .alert-dismissible for close — _Bootstrap_
- Alert + AlertTitle + AlertDescription + AlertBody + AlertActions parts — _Catalyst (Tailwind Labs)_
- Composite Alert.Root + Indicator + Title + Description — _Chakra UI_
- MessageBar + Title/Body/Actions/GroupHeader slots with intent color set — _Fluent UI React (v9 / Fluent 2)_
- Variants solid/flat/faded/bordered — _HeroUI_
- Severity success/info/warning/error; filled/outlined/standard — _MUI (Material UI)_
- Variants light/filled/outline/transparent — _Mantine_
- Config-driven (docs.json) not MDX-imported; three preset types (info/warning/critical) — _Mintlify_
- Top-of-page notification; dismissed state stored in localStorage under storageKey (default 'nextra-banner'). — _Nextra_
- Dismissable; tone drives critical/warning/info/success. — _Polaris (Shopify)_
- Compact alert without dismiss. — _Primer (GitHub)_
- 6 alert-banner variants — _Tailwind Plus UI Blocks_
- alert + alert-{info|success|warning|error} + alert-{outline|dash|soft} — _daisyUI_
- Static composition: Alert + AlertTitle + AlertDescription; variant via CVA — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/alert) — `Alert`
- [Atlassian Design System](https://atlassian.design/components/inline-message/examples) — `Inline message`
- [BaseWeb (Uber)](https://baseweb.design/components/banner/) — `Banner`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/alerts/) — `Alerts`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/alert) — `Alert`
- [Chakra UI](https://chakra-ui.com/docs/components/alert) — `Alert`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-messagebar--docs) — `MessageBar`
- [HeroUI](https://heroui.com/en/docs/react/components/alert) — `Alert`
- [MUI (Material UI)](https://mui.com/material-ui/react-alert/) — `Alert`
- [Mantine](https://mantine.dev/core/alert/) — `Alert`
- [Mintlify](https://mintlify.com/docs/components/banner) — `Banner`
- [Nextra](https://nextra.site/docs/built-ins/banner) — `Banner`
- [Polaris (Shopify)](https://polaris.shopify.com/components/feedback-indicators/banner) — `Banner`
- [Primer (GitHub)](https://primer.style/components/inline-message) — `InlineMessage`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/feedback/alerts) — `Alerts`
- [daisyUI](https://daisyui.com/components/alert/) — `Alert`
- [shadcn/ui](https://ui.shadcn.com/docs/components/alert) — `Alert`

---

### Accordion

**Systems including:** 16  |  **Lens:** both  |  **Teseor:** missing

**Category:** composite (all 16 systems)

**Aliases observed:** `Accordion`, `Accordion (details/summary)`, `AccordionGroup`, `Expandable`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `value` | 6 (Ark UI, Base UI, Chakra UI, Mantine, Radix UI Primitives, shadcn/ui) |
| `collapsible` | 5 (Ark UI, Chakra UI, Fluent UI React (v9 / Fluent 2), Radix UI Primitives, shadcn/ui) |
| `disabled` | 5 (Ark UI, Base UI, Carbon (IBM), MUI (Material UI), Radix UI Primitives) |
| `onValueChange` | 5 (Ark UI, Base UI, Chakra UI, Radix UI Primitives, shadcn/ui) |
| `defaultValue` | 4 (Ark UI, Base UI, Radix UI Primitives, shadcn/ui) |
| `multiple` | 4 (Ark UI, Chakra UI, Fluent UI React (v9 / Fluent 2), Mantine) |
| `onChange` | 3 (BaseWeb (Uber), MUI (Material UI), Mantine) |
| `orientation` | 3 (Ark UI, Base UI, Radix UI Primitives) |
| `variant` | 2 (HeroUI, Mantine) |
| `accordion` | 1 (BaseWeb (Uber)) |
| `align` | 1 (Carbon (IBM)) |
| `allowsMultipleExpanded` | 1 (React Spectrum (Adobe)) |
| `chevronPosition` | 1 (Mantine) |
| `children` | 1 (React Spectrum (Adobe)) |
| `defaultExpanded` | 1 (MUI (Material UI)) |
| `defaultExpandedKeys` | 1 (React Spectrum (Adobe)) |
| `defaultOpen` | 1 (Mintlify) |
| `defaultOpenItems` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `dir` | 1 (Radix UI Primitives) |
| `expanded` | 1 (MUI (Material UI)) |
| `expandedKeys` | 1 (React Spectrum (Adobe)) |
| `initialState` | 1 (BaseWeb (Uber)) |
| `isCompact` | 1 (HeroUI) |
| `isFlush` | 1 (Carbon (IBM)) |
| `navigation` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `onExpandedChange` | 1 (React Spectrum (Adobe)) |
| `onToggle` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `open` | 1 (Pico.css) |
| `openItems` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `openMultiple` | 1 (Base UI) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `renderAll` | 1 (BaseWeb (Uber)) |
| `selectedKeys` | 1 (HeroUI) |
| `selectionMode` | 1 (HeroUI) |
| `showDivider` | 1 (HeroUI) |
| `size` | 1 (Carbon (IBM)) |
| `stateReducer` | 1 (BaseWeb (Uber)) |
| `title` | 1 (Mintlify) |
| `TransitionComponent` | 1 (MUI (Material UI)) |
| `type` | 1 (shadcn/ui) |
| _… +1 more props_ | |

**A11y / ARIA observations:**

- aria-expanded/controls; region role on panels — _Chakra UI, Mantine_
- WAI-ARIA Accordion with Space/Enter expansion and arrow nav — _Ark UI_
- WAI-ARIA Accordion with Space/Enter and arrow nav — _Base UI_
- Header is a button with aria-expanded/aria-controls; panel region linked via aria-labelledby — _BaseWeb (Uber)_
- aria-expanded/controls + role region wired by data-bs-target — _Bootstrap_
- buttons with aria-expanded; region for panels. — _Carbon (IBM)_
- AccordionHeader renders button with aria-expanded/controls; panel labelled via aria-labelledby — _Fluent UI React (v9 / Fluent 2)_
- ARIA accordion via React Aria DisclosureGroup; aria-expanded/controls — _HeroUI_
- aria-expanded/controls on Summary; region role for Details — _MUI (Material UI)_
- Disclosure pattern; full ARIA not documented — _Mintlify_
- native disclosure semantics via details/summary — _Pico.css_
- WAI-ARIA Accordion pattern with Space/Enter expansion, arrow/Home/End trigger navigation — _Radix UI Primitives_
- Disclosure pattern with aria-expanded/controls; heading wraps button — _React Spectrum (Adobe)_
- Native radio inputs for exclusive open; collapse exposes content — _daisyUI_
- Radix primitive: aria-expanded, disclosure pattern, keyboard arrow nav — _shadcn/ui_

**Design choices observed:**

- Part-based (Root/Item/ItemTrigger/ItemContent/ItemIndicator); Zag state-machine; controlled+uncontrolled — _Ark UI_
- Part-based (Root/Item/Header/Trigger/Panel); \`render\` prop slot; controlled+uncontrolled — _Base UI_
- Stateful + Stateless duals; overrides slots (Header/Content/PanelContainer/ToggleIcon) — _BaseWeb (Uber)_
- Class-based composition: .accordion + .accordion-item + .accordion-button + .accordion-collapse; JS plugin handles toggle — _Bootstrap_
- Compound with AccordionItem; controlled or uncontrolled. — _Carbon (IBM)_
- Composite Accordion.\* parts (Root, Item, ItemTrigger, ItemContent) — _Chakra UI_
- Accordion + AccordionItem + AccordionHeader + AccordionPanel slot composition — _Fluent UI React (v9 / Fluent 2)_
- Composite Accordion + AccordionItem; variants light/shadow/bordered/splitted — _HeroUI_
- Composite Accordion + Summary + Details + Actions — _MUI (Material UI)_
- Composite Accordion.Item + Control + Panel — _Mantine_
- Nested disclosure for API ResponseField object properties — _Mintlify_
- classless tag-based; role=button on summary supported as variant — _Pico.css_
- Part-based (Root/Item/Header/Trigger/Content); controlled+uncontrolled; asChild slot; data-state attrs for styling — _Radix UI Primitives_
- Item-based collection of Disclosure panels — _React Spectrum (Adobe)_
- Composes collapse + radio inputs; collapse-arrow / collapse-plus — _daisyUI_
- Radix-based, controlled or uncontrolled, single/multiple via type prop — _shadcn/ui_

**Source URLs:**

- [Ark UI](https://ark-ui.com/docs/components/accordion) — `Accordion`
- [Base UI](https://base-ui.com/react/components/accordion) — `Accordion`
- [BaseWeb (Uber)](https://baseweb.design/components/accordion/) — `Accordion`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/accordion/) — `Accordion`
- [Carbon (IBM)](https://carbondesignsystem.com/components/accordion/usage/) — `Accordion`
- [Chakra UI](https://chakra-ui.com/docs/components/accordion) — `Accordion`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-accordion--docs) — `Accordion`
- [HeroUI](https://heroui.com/en/docs/react/components/accordion) — `Accordion`
- [MUI (Material UI)](https://mui.com/material-ui/react-accordion/) — `Accordion`
- [Mantine](https://mantine.dev/core/accordion/) — `Accordion`
- [Mintlify](https://mintlify.com/docs/components/expandables) — `Expandable`
- [Pico.css](https://picocss.com/docs/accordion) — `Accordion (details/summary)`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/accordion) — `Accordion`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Accordion.html) — `Accordion`
- [daisyUI](https://daisyui.com/components/accordion/) — `Accordion`
- [shadcn/ui](https://ui.shadcn.com/docs/components/accordion) — `Accordion`

---

### Breadcrumbs

**Systems including:** 16  |  **Lens:** both  |  **Teseor:** missing

**Category:** composite (all 16 systems)

**Aliases observed:** `Breadcrumb`, `Breadcrumbs`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `separator` | 6 (Ant Design, Chakra UI, HeroUI, MUI (Material UI), Mantine, shadcn/ui) |
| `size` | 4 (Chakra UI, Fluent UI React (v9 / Fluent 2), HeroUI, React Spectrum (Adobe)) |
| `onAction` | 3 (HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `children` | 2 (BaseWeb (Uber), Fluent UI React (v9 / Fluent 2)) |
| `isDisabled` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `items` | 2 (Ant Design, React Aria Components) |
| `itemsAfterCollapse` | 2 (Atlassian Design System, MUI (Material UI)) |
| `itemsBeforeCollapse` | 2 (Atlassian Design System, MUI (Material UI)) |
| `maxItems` | 2 (Atlassian Design System, MUI (Material UI)) |
| `appearance` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `aria-label` | 1 (Carbon (IBM)) |
| `ariaLabel` | 1 (BaseWeb (Uber)) |
| `asChild` | 1 (shadcn/ui) |
| `color` | 1 (HeroUI) |
| `dividerType` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `focusMode` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `href` | 1 (Primer (GitHub)) |
| `isMultiline` | 1 (React Spectrum (Adobe)) |
| `noTrailingSlash` | 1 (Carbon (IBM)) |
| `onExpand` | 1 (Atlassian Design System) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `params` | 1 (Ant Design) |
| `selected` | 1 (Primer (GitHub)) |
| `separatorMargin` | 1 (Mantine) |
| `showRoot` | 1 (React Spectrum (Adobe)) |
| `showTrailingSeparator` | 1 (BaseWeb (Uber)) |
| `underline` | 1 (HeroUI) |
| `variant` | 1 (HeroUI) |

**A11y / ARIA observations:**

- nav aria-label=breadcrumb — _Ant Design_
- nav with aria-label; aria-current on last. — _Atlassian Design System_
- Nav landmark with aria-label; current item has aria-current=page — _BaseWeb (Uber)_
- nav aria-label=breadcrumb; aria-current=page on active — _Bootstrap_
- nav landmark with aria-current=page. — _Carbon (IBM)_
- nav aria-label=breadcrumb; aria-current=page — _Chakra UI_
- nav landmark; BreadcrumbItem aria-current=page for terminal item — _Fluent UI React (v9 / Fluent 2)_
- React Aria Breadcrumbs: nav + aria-current=page — _HeroUI_
- aria-label=breadcrumb on nav; aria-current=page on last — _MUI (Material UI)_
- Renders nav; consumer adds aria-label — _Mantine_
- nav with aria-label=Breadcrumb; current page aria-current. — _Primer (GitHub)_
- nav aria-label=breadcrumb with current-page aria-current — _React Aria Components_
- nav landmark with aria-label; current item aria-current=page — _React Spectrum (Adobe)_
- nav aria-label="breadcrumb" — _Tailwind Plus UI Blocks_
- nav semantics expected — _daisyUI_
- nav aria-label="breadcrumb"; current page aria-current="page" — _shadcn/ui_

**Design choices observed:**

- Items-prop API; dropdown menus on items — _Ant Design_
- Auto-collapse with overflow button. — _Atlassian Design System_
- Wraps children in \<nav\>\<ol\>; separator slot overridable — _BaseWeb (Uber)_
- ol.breadcrumb + .breadcrumb-item; CSS-generated separators — _Bootstrap_
- Compound with BreadcrumbItem. — _Carbon (IBM)_
- Composite Breadcrumb.Root + List + Item + Link/CurrentLink — _Chakra UI_
- Breadcrumb + BreadcrumbItem + BreadcrumbDivider + BreadcrumbButton parts — _Fluent UI React (v9 / Fluent 2)_
- Composite Breadcrumbs + BreadcrumbItem; collapsible long lists — _HeroUI_
- Auto-collapse when overflowing — _MUI (Material UI)_
- Children rendered with separators — _Mantine_
- Compound .Item children with selected flag. — _Primer (GitHub)_
- Part-based (Breadcrumbs/Breadcrumb); collection items — _React Aria Components_
- Collection of Item children with overflow menu — _React Spectrum (Adobe)_
- 4 breadcrumb variants — _Tailwind Plus UI Blocks_
- breadcrumbs container with \<ul\>\<li\> children; CSS separators — _daisyUI_
- Compositional parts: Breadcrumb/List/Item/Link/Page/Separator/Ellipsis — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/breadcrumb) — `Breadcrumb`
- [Atlassian Design System](https://atlassian.design/components/breadcrumbs/examples) — `Breadcrumbs`
- [BaseWeb (Uber)](https://baseweb.design/components/breadcrumbs/) — `Breadcrumbs`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/breadcrumb/) — `Breadcrumb`
- [Carbon (IBM)](https://carbondesignsystem.com/components/breadcrumb/usage/) — `Breadcrumb`
- [Chakra UI](https://chakra-ui.com/docs/components/breadcrumb) — `Breadcrumb`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-breadcrumb--docs) — `Breadcrumb`
- [HeroUI](https://heroui.com/en/docs/react/components/breadcrumbs) — `Breadcrumbs`
- [MUI (Material UI)](https://mui.com/material-ui/react-breadcrumbs/) — `Breadcrumbs`
- [Mantine](https://mantine.dev/core/breadcrumbs/) — `Breadcrumbs`
- [Primer (GitHub)](https://primer.style/components/breadcrumbs) — `Breadcrumbs`
- [React Aria Components](https://react-aria.adobe.com/Breadcrumbs) — `Breadcrumbs`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Breadcrumbs.html) — `Breadcrumbs`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/navigation/breadcrumbs) — `Breadcrumbs`
- [daisyUI](https://daisyui.com/components/breadcrumbs/) — `Breadcrumbs`
- [shadcn/ui](https://ui.shadcn.com/docs/components/breadcrumb) — `Breadcrumb`

---

### Divider

**Systems including:** 16  |  **Lens:** doc  |  **Teseor:** missing

**Category mix:** primitive×11, layout×5

**Aliases observed:** `Divider`, `Dividers`, `Separator`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `orientation` | 10 (Ant Design, Base UI, Chakra UI, HeroUI +6 more) |
| `variant` | 4 (Ant Design, Chakra UI, MUI (Material UI), Mantine) |
| `decorative` | 3 (HeroUI, Radix UI Primitives, shadcn/ui) |
| `size` | 3 (BaseWeb (Uber), Chakra UI, React Spectrum (Adobe)) |
| `alignContent` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `appearance` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `asChild` | 1 (Radix UI Primitives) |
| `borderColor` | 1 (Polaris (Shopify)) |
| `borderWidth` | 1 (Polaris (Shopify)) |
| `className` | 1 (Catalyst (Tailwind Labs)) |
| `dashed` | 1 (Ant Design) |
| `elementType` | 1 (React Aria Components) |
| `flexItem` | 1 (MUI (Material UI)) |
| `inset` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `label` | 1 (Mantine) |
| `labelPosition` | 1 (Mantine) |
| `light` | 1 (MUI (Material UI)) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `plain` | 1 (Ant Design) |
| `soft` | 1 (Catalyst (Tailwind Labs)) |
| `textAlign` | 1 (MUI (Material UI)) |
| `type` | 1 (Ant Design) |
| `vertical` | 1 (Fluent UI React (v9 / Fluent 2)) |

**A11y / ARIA observations:**

- role=separator — _Ant Design, Chakra UI, MUI (Material UI), Mantine_
- role=separator with orientation — _BaseWeb (Uber), Fluent UI React (v9 / Fluent 2), React Spectrum (Adobe)_
- role=separator with aria-orientation — _Base UI, React Aria Components_
- role="separator" — _Catalyst (Tailwind Labs)_
- role=separator (or aria-hidden when decorative) — _HeroUI_
- role=separator. — _Polaris (Shopify)_
- role=separator (or none when decorative) with proper aria-orientation — _Radix UI Primitives_
- role="separator" semantics — _Tailwind Plus UI Blocks_
- role="separator" expected — _daisyUI_
- Radix primitive: role="separator" or decorative — _shadcn/ui_

**Design choices observed:**

- Horizontal/vertical with optional text — _Ant Design_
- Single-part; render-prop slot — _Base UI_
- Single line element with size token — _BaseWeb (Uber)_
- Horizontal rule with soft variant — _Catalyst (Tailwind Labs)_
- Divider primitive — _Chakra UI_
- Visual divider with optional label slot — _Fluent UI React (v9 / Fluent 2)_
- React Aria Separator — _HeroUI_
- Inset/middle/full-width; supports inline text — _MUI (Material UI)_
- Optional inline label — _Mantine_
- Token-driven hr. — _Polaris (Shopify)_
- Single-part; asChild slot — _Radix UI Primitives_
- Polymorphic via elementType — _React Aria Components_
- Token sizes with horizontal/vertical layout support — _React Spectrum (Adobe)_
- 8 divider variants — _Tailwind Plus UI Blocks_
- divider + divider-{horizontal|vertical} + divider-{color|start|end} — _daisyUI_
- Radix-based — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/divider) — `Divider`
- [Base UI](https://base-ui.com/react/components/separator) — `Separator`
- [BaseWeb (Uber)](https://baseweb.design/components/divider/) — `Divider`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/divider) — `Divider`
- [Chakra UI](https://chakra-ui.com/docs/components/separator) — `Separator`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-divider--docs) — `Divider`
- [HeroUI](https://heroui.com/en/docs/react/components/separator) — `Separator`
- [MUI (Material UI)](https://mui.com/material-ui/react-divider/) — `Divider`
- [Mantine](https://mantine.dev/core/divider/) — `Divider`
- [Polaris (Shopify)](https://polaris.shopify.com/components/layout-and-structure/divider) — `Divider`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/separator) — `Separator`
- [React Aria Components](https://react-aria.adobe.com/Separator) — `Separator`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Divider.html) — `Divider`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/layout/dividers) — `Dividers`
- [daisyUI](https://daisyui.com/components/divider/) — `Divider`
- [shadcn/ui](https://ui.shadcn.com/docs/components/separator) — `Separator`

---

### Heading

**Systems including:** 16  |  **Lens:** doc  |  **Teseor:** missing

**Category:** primitive (all 16 systems)

**Aliases observed:** `Heading`, `Headings (h1-h6)`, `Title`, `prose h1`, `prose h2`, `prose h3`, `prose h4`, `prose-h1`, `prose-h2`, `prose-h3`, `prose-h4`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `as` | 4 (Atlassian Design System, Carbon (IBM), Chakra UI, Primer (GitHub)) |
| `size` | 3 (Atlassian Design System, Chakra UI, Mantine) |
| `color` | 2 (Atlassian Design System, BaseWeb (Uber)) |
| `level` | 2 (Catalyst (Tailwind Labs), React Spectrum (Adobe)) |
| `$as` | 1 (BaseWeb (Uber)) |
| `children` | 1 (React Spectrum (Adobe)) |
| `className` | 1 (Catalyst (Tailwind Labs)) |
| `HTMLAttributes` | 1 (Tiptap) |
| `levels` | 1 (Tiptap) |
| `order` | 1 (Mantine) |
| `slot` | 1 (React Spectrum (Adobe)) |
| `styleLevel` | 1 (BaseWeb (Uber)) |
| `sx` | 1 (Primer (GitHub)) |
| `textStyle` | 1 (Chakra UI) |
| `textWrap` | 1 (Mantine) |
| `variant` | 1 (Primer (GitHub)) |

**A11y / ARIA observations:**

- Semantic level via \`as\`. — _Atlassian Design System, Primer (GitHub)_
- Renders h1-h6 element semantically — _BaseWeb (Uber)_
- Heading level inferred from nesting via Section. — _Carbon (IBM)_
- Maps to h1–h6 semantically — _Catalyst (Tailwind Labs)_
- Semantic h1-h6 via as — _Chakra UI_
- Renders h1-h6 via order prop — _Mantine_
- Renders semantic h1-h6 — _React Spectrum (Adobe)_
- No ARIA impact — _Tailwind Typography (prose plugin)_
- Maps to \<h1\>–\<h6\> — _Tiptap_
- heading link via a\[href^='#'\]\[id\]:empty creates anchor link affordance — _awsm.css_

**Design choices observed:**

- classless type scale — _MVP.css, Simple.css, new.css_
- Size token decoupled from semantic level. — _Atlassian Design System_
- Typography primitive with level decoupled from style level — _BaseWeb (Uber)_
- Auto-leveled via Section provider. — _Carbon (IBM)_
- Heading + Subheading components — _Catalyst (Tailwind Labs)_
- Typography token-driven — _Chakra UI_
- Semantic heading — _Mantine_
- Variant maps to type scale tokens. — _Primer (GitHub)_
- Typography primitive; used as Dialog title slot — _React Spectrum (Adobe)_
- classless type scale with serif/sans pair — _Sakura.css_
- Element modifier targeting h4 only — _Tailwind Typography (prose plugin)_
- Configurable allowed levels — _Tiptap_
- tag-styled type scale, classless — _Water.css_
- classless type scale; empty in-heading anchor link gets generated marker — _awsm.css_

**Source URLs:**

- [Atlassian Design System](https://atlassian.design/components/heading/examples) — `Heading`
- [BaseWeb (Uber)](https://baseweb.design/components/heading/) — `Heading`
- [Carbon (IBM)](https://github.com/carbon-design-system/carbon/tree/main/packages/react/src/components/Heading) — `Heading`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/heading) — `Heading`
- [Chakra UI](https://chakra-ui.com/docs/components/heading) — `Heading`
- [MVP.css](https://andybrewer.github.io/mvp/) — `Headings (h1-h6)`
- [Mantine](https://mantine.dev/core/title/) — `Title`
- [Primer (GitHub)](https://primer.style/components/heading) — `Heading`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Heading.html) — `Heading`
- [Sakura.css](https://github.com/oxalorg/sakura/blob/master/css/sakura.css) — `Headings (h1-h6)`
- [Simple.css](https://simplecss.org/demo) — `Headings (h1-h6)`
- [Tailwind Typography (prose plugin)](https://github.com/tailwindlabs/tailwindcss-typography) — `prose-h4`
- [Tiptap](https://tiptap.dev/docs/editor/extensions/nodes/heading) — `Heading`
- [Water.css](https://watercss.kognise.dev/) — `Headings (h1-h6)`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Headings (h1-h6)`
- [new.css](https://newcss.net/demo/) — `Headings (h1-h6)`

---

### Text

**Systems including:** 16  |  **Lens:** doc  |  **Teseor:** missing

**Category mix:** primitive×15, composite×1

**Aliases observed:** `Text`, `Typography`, `Typography (Label/Paragraph/Display/Mono)`, `Typography (h1-h6, p, blockquote, address, abbr, mark)`, `text`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `as` | 6 (Atlassian Design System, Chakra UI, Fluent UI React (v9 / Fluent 2), HeroUI, Polaris (Shopify), Primer (GitHub)) |
| `size` | 5 (Atlassian Design System, Chakra UI, Fluent UI React (v9 / Fluent 2), HeroUI, Primer (GitHub)) |
| `color` | 4 (Atlassian Design System, BaseWeb (Uber), HeroUI, MUI (Material UI)) |
| `truncate` | 4 (Chakra UI, Fluent UI React (v9 / Fluent 2), HeroUI, Polaris (Shopify)) |
| `weight` | 4 (Atlassian Design System, Fluent UI React (v9 / Fluent 2), HeroUI, Primer (GitHub)) |
| `align` | 2 (Fluent UI React (v9 / Fluent 2), MUI (Material UI)) |
| `children` | 2 (Mantine, React Spectrum (Adobe)) |
| `className` | 2 (Catalyst (Tailwind Labs), shadcn/ui) |
| `ellipsis` | 2 (Ant Design, Tiptap) |
| `variant` | 2 (MUI (Material UI), Polaris (Shopify)) |
| `$as` | 1 (BaseWeb (Uber)) |
| `alignment` | 1 (Polaris (Shopify)) |
| `closeDoubleQuote` | 1 (Tiptap) |
| `component` | 1 (MUI (Material UI)) |
| `copyable` | 1 (Ant Design) |
| `editable` | 1 (Ant Design) |
| `emDash` | 1 (Tiptap) |
| `fontWeight` | 1 (Polaris (Shopify)) |
| `gutterBottom` | 1 (MUI (Material UI)) |
| `help` | 1 (FormKit) |
| `italic` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `label` | 1 (FormKit) |
| `level` | 1 (Ant Design) |
| `maxLines` | 1 (Atlassian Design System) |
| `name` | 1 (FormKit) |
| `noWrap` | 1 (MUI (Material UI)) |
| `openDoubleQuote` | 1 (Tiptap) |
| `placeholder` | 1 (FormKit) |
| `slot` | 1 (React Spectrum (Adobe)) |
| `sx` | 1 (Primer (GitHub)) |
| `textStyle` | 1 (Chakra UI) |
| `tone` | 1 (Polaris (Shopify)) |
| `type` | 1 (Ant Design) |
| `underline` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `validation` | 1 (FormKit) |
| `validation-visibility` | 1 (FormKit) |
| `value` | 1 (FormKit) |

**A11y / ARIA observations:**

- Semantic element via \`as\`. — _Atlassian Design System, Primer (GitHub)_
- Semantic h1-h6/p; copy/edit buttons labeled — _Ant Design_
- Maps to semantic element via $as prop — _BaseWeb (Uber)_
- Renders the requested HTML element semantically — _Fluent UI React (v9 / Fluent 2)_
- Wraps native input, auto-associates \<label for\>, exposes validation messages with aria-describedby — _FormKit_
- Semantic element via as prop — _HeroUI_
- Renders semantic element via component prop — _MUI (Material UI)_
- uses native semantics; abbr\[title\] surfaces tooltip via data-tooltip pattern — _Pico.css_
- \`as\` controls semantic element. — _Polaris (Shopify)_
- Inline text; slot wires correct typography context — _React Spectrum (Adobe)_
- Semantic headings (h1-h4) and inline elements — _shadcn/ui_

**Design choices observed:**

- Composite Typography.Title/Paragraph/Text/Link with built-in copy/edit — _Ant Design_
- Body-text typography primitive. — _Atlassian Design System_
- Token-driven text components: DisplayN, HeadingN, LabelN, ParagraphN, Mono\* — _BaseWeb (Uber)_
- Text + TextLink + Strong + Code prose components — _Catalyst (Tailwind Labs)_
- Polymorphic paragraph/span — _Chakra UI_
- Generic typography primitive with token-driven size/weight; specialised Title/Body/Caption/etc. siblings — _Fluent UI React (v9 / Fluent 2)_
- Schema-driven single-component API — type prop selects renderer, shared prop/validation surface across all inputs — _FormKit_
- Polymorphic typography primitive — _HeroUI_
- Theme typography variants (h1..body2..caption) — _MUI (Material UI)_
- Styles raw HTML children (markdown output) — _Mantine_
- classless tag styling with fluid type scale — _Pico.css_
- Variant-driven typography; tone tokens. — _Polaris (Shopify)_
- Token-driven typography. — _Primer (GitHub)_
- Slot-aware text primitive used inside other components — _React Spectrum (Adobe)_
- Smart-substitution input rules for quotes/dashes — _Tiptap_
- Style guide reference (not a component): h1/h2/h3/p/blockquote/list/code styles — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/typography) — `Typography`
- [Atlassian Design System](https://atlassian.design/components/primitives/text/examples) — `Text`
- [BaseWeb (Uber)](https://baseweb.design/components/typography/) — `Typography (Label/Paragraph/Display/Mono)`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/text) — `Text`
- [Chakra UI](https://chakra-ui.com/docs/components/text) — `Text`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-text--docs) — `Text`
- [FormKit](https://formkit.com/inputs/text) — `text`
- [HeroUI](https://heroui.com/en/docs/react/components/typography) — `Typography`
- [MUI (Material UI)](https://mui.com/material-ui/react-typography/) — `Typography`
- [Mantine](https://mantine.dev/core/typography/) — `Typography`
- [Pico.css](https://picocss.com/docs/typography) — `Typography (h1-h6, p, blockquote, address, abbr, mark)`
- [Polaris (Shopify)](https://polaris.shopify.com/components/typography/text) — `Text`
- [Primer (GitHub)](https://primer.style/components/text) — `Text`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Text.html) — `Text`
- [Tiptap](https://tiptap.dev/docs/editor/extensions/functionality/typography) — `Typography`
- [shadcn/ui](https://ui.shadcn.com/docs/components/typography) — `Typography`

---

### Image

**Systems including:** 15  |  **Lens:** doc  |  **Teseor:** missing

**Category mix:** primitive×14, composite×1

**Aliases observed:** `Image`, `Image (Lazy Loading)`, `Image (MDX)`, `Image (img)`, `Image / picture`, `Image / video (img, video)`, `prose img`, `prose picture`, `prose-img`, `prose-picture`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `alt` | 6 (Ant Design, Atlassian Design System, Chakra UI, Docusaurus, Mantine, React Spectrum (Adobe)) |
| `src` | 6 (Ant Design, Atlassian Design System, Chakra UI, Docusaurus, Mantine, React Spectrum (Adobe)) |
| `fit` | 3 (Chakra UI, Fluent UI React (v9 / Fluent 2), Mantine) |
| `fallback` | 2 (Ant Design, Chakra UI) |
| `loading` | 2 (Atlassian Design System, Chakra UI) |
| `allowBase64` | 1 (Tiptap) |
| `block` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `bordered` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `fallbackSrc` | 1 (Mantine) |
| `HTMLAttributes` | 1 (Tiptap) |
| `inline` | 1 (Tiptap) |
| `lazyLoading` | 1 (VitePress) |
| `objectFit` | 1 (React Spectrum (Adobe)) |
| `placeholder` | 1 (Ant Design) |
| `preview` | 1 (Ant Design) |
| `radius` | 1 (Mantine) |
| `shadow` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `shape` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `slot` | 1 (React Spectrum (Adobe)) |
| `srcDark` | 1 (Atlassian Design System) |
| `width` | 1 (Ant Design) |

**A11y / ARIA observations:**

- Native img; preview overlay controls labeled — _Ant Design_
- alt is required. — _Atlassian Design System_
- Native img; alt required — _Chakra UI_
- Standard \<img\>; alt forwarded. — _Docusaurus_
- img semantics; alt passthrough — _Fluent UI React (v9 / Fluent 2)_
- Native img with alt — _Mantine_
- img semantics with alt; decorative when alt empty — _React Spectrum (Adobe)_
- No ARIA impact — _Tailwind Typography (prose plugin)_
- Renders \<img\> with alt attribute — _Tiptap_
- Standard \<img\>; alt from Markdown. — _VitePress_

**Design choices observed:**

- responsive max-width:100% — _Water.css, new.css_
- Composite Image + Image.PreviewGroup with built-in zoom/rotate preview — _Ant Design_
- Built-in light/dark source switching. — _Atlassian Design System_
- Img wrapper with fallback support — _Chakra UI_
- Markdown \!\[alt\](path) or imported asset; webpack resolves and hashes static paths. — _Docusaurus_
- Styled img with shape (rounded/circular/square) and object-fit modes — _Fluent UI React (v9 / Fluent 2)_
- Img wrapper with fallback — _Mantine_
- Slot-aware Image used in Card/Avatar contexts — _React Spectrum (Adobe)_
- responsive media (max-width:100%) — _Sakura.css_
- full-width responsive inside main — _Simple.css_
- Element modifier targeting picture element — _Tailwind Typography (prose plugin)_
- Inline-or-block configurable — _Tiptap_
- Markdown \!\[alt\](src); markdown.image.lazyLoading: true adds loading=lazy to all images. — _VitePress_
- responsive media; p\>img and p\>picture get inline behavior — _awsm.css_

**Source URLs:**

- [Ant Design](https://ant.design/components/image) — `Image`
- [Atlassian Design System](https://atlassian.design/components/image/examples) — `Image`
- [Chakra UI](https://chakra-ui.com/docs/components/image) — `Image`
- [Docusaurus](https://docusaurus.io/docs/markdown-features/assets) — `Image (MDX)`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-image--docs) — `Image`
- [Mantine](https://mantine.dev/core/image/) — `Image`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Image.html) — `Image`
- [Sakura.css](https://github.com/oxalorg/sakura/blob/master/css/sakura.css) — `Image / video (img, video)`
- [Simple.css](https://simplecss.org/demo) — `Image (img)`
- [Tailwind Typography (prose plugin)](https://github.com/tailwindlabs/tailwindcss-typography) — `prose-picture`
- [Tiptap](https://tiptap.dev/docs/editor/extensions/nodes/image) — `Image`
- [VitePress](https://vitepress.dev/guide/markdown#image-lazy-loading) — `Image (Lazy Loading)`
- [Water.css](https://watercss.kognise.dev/) — `Image (img)`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Image / picture`
- [new.css](https://newcss.net/demo/) — `Image (img)`

---

### Collapsible

**Systems including:** 13  |  **Lens:** both  |  **Teseor:** missing

**Category mix:** composite×11, primitive×2

**Aliases observed:** `Collapse`, `Collapsible`, `Disclosure`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `open` | 6 (Ark UI, Base UI, Chakra UI, Polaris (Shopify), Radix UI Primitives, shadcn/ui) |
| `defaultOpen` | 5 (Ark UI, Base UI, Headless UI (React), Radix UI Primitives, shadcn/ui) |
| `onOpenChange` | 5 (Ark UI, Base UI, Chakra UI, Radix UI Primitives, shadcn/ui) |
| `disabled` | 4 (Ark UI, Base UI, Chakra UI, Radix UI Primitives) |
| `defaultExpanded` | 2 (HeroUI, React Aria Components) |
| `isExpanded` | 2 (HeroUI, React Aria Components) |
| `onExpandedChange` | 2 (HeroUI, React Aria Components) |
| `accordion` | 1 (Ant Design) |
| `activeKey` | 1 (Ant Design) |
| `animateOpacity` | 1 (Mantine) |
| `as` | 1 (Headless UI (React)) |
| `asChild` | 1 (Radix UI Primitives) |
| `bordered` | 1 (Ant Design) |
| `expandIcon` | 1 (Ant Design) |
| `expandOnPrint` | 1 (Polaris (Shopify)) |
| `ghost` | 1 (Ant Design) |
| `id` | 1 (Polaris (Shopify)) |
| `in` | 1 (Mantine) |
| `isDisabled` | 1 (React Aria Components) |
| `items` | 1 (Ant Design) |
| `transition` | 1 (Polaris (Shopify)) |
| `transitionDuration` | 1 (Mantine) |

**A11y / ARIA observations:**

- aria-expanded/controls on trigger — _Chakra UI, HeroUI_
- aria-expanded/controls; region role on panels — _Ant Design_
- aria-expanded toggle with aria-controls — _Ark UI_
- aria-expanded toggle with aria-controls panel binding — _Base UI_
- aria-expanded/controls wired by data-bs-target — _Bootstrap_
- aria-expanded toggle with aria-controls panel association — _Headless UI (React)_
- aria-expanded; aria-hidden when closed. — _Polaris (Shopify)_
- aria-expanded on trigger; hidden=until-found compatible content — _Radix UI Primitives_
- Disclosure pattern with aria-expanded/aria-controls — _React Aria Components_
- Native \<details\>/\<summary\> or hidden checkbox for state — _daisyUI_
- Radix primitive: aria-expanded disclosure pattern — _shadcn/ui_

**Design choices observed:**

- Items-prop API; optional accordion mode — _Ant Design_
- Part-based (Root/Trigger/Content/Indicator) — _Ark UI_
- Part-based (Root/Trigger/Panel) — _Base UI_
- .collapse + data-bs-toggle=collapse; JS plugin — _Bootstrap_
- Composite Collapsible.Root + Trigger + Content — _Chakra UI_
- Part-based (Disclosure/DisclosureButton/DisclosurePanel); render-prop open state; uncontrolled-first — _Headless UI (React)_
- Composite Disclosure + DisclosureTrigger + DisclosurePanel — _HeroUI_
- Animated height collapse wrapper — _Mantine_
- Controlled disclosure container. — _Polaris (Shopify)_
- Part-based (Root/Trigger/Content); controlled+uncontrolled — _Radix UI Primitives_
- Part-based (Disclosure/DisclosureGroup/Button/DisclosurePanel/Heading) — _React Aria Components_
- Two modes: details/summary or focus/checkbox; collapse-{arrow|plus|open|close} — _daisyUI_
- Radix-based; Root/Trigger/Content parts — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/collapse) — `Collapse`
- [Ark UI](https://ark-ui.com/docs/components/collapsible) — `Collapsible`
- [Base UI](https://base-ui.com/react/components/collapsible) — `Collapsible`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/collapse/) — `Collapse`
- [Chakra UI](https://chakra-ui.com/docs/components/collapsible) — `Collapsible`
- [Headless UI (React)](https://headlessui.com/react/disclosure) — `Disclosure`
- [HeroUI](https://heroui.com/en/docs/react/components/disclosure) — `Disclosure`
- [Mantine](https://mantine.dev/core/collapse/) — `Collapse`
- [Polaris (Shopify)](https://polaris.shopify.com/components/utilities/collapsible) — `Collapsible`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/collapsible) — `Collapsible`
- [React Aria Components](https://react-aria.adobe.com/Disclosure) — `Disclosure`
- [daisyUI](https://daisyui.com/components/collapse/) — `Collapse`
- [shadcn/ui](https://ui.shadcn.com/docs/components/collapsible) — `Collapsible`

---

### Blockquote

**Systems including:** 11  |  **Lens:** doc  |  **Teseor:** missing

**Category:** primitive (all 11 systems)

**Aliases observed:** `Blockquote`, `Blockquote (+ footer attribution)`, `Blockquote / cite`, `prose blockquote`, `prose-blockquote`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `cite` | 2 (Chakra UI, Mantine) |
| `icon` | 2 (Chakra UI, Mantine) |
| `color` | 1 (Mantine) |
| `HTMLAttributes` | 1 (Tiptap) |
| `iconSize` | 1 (Mantine) |
| `showDash` | 1 (Chakra UI) |
| `variant` | 1 (Chakra UI) |

**A11y / ARIA observations:**

- native quotation semantics — _Sakura.css, Simple.css, Water.css +2 more_
- Semantic blockquote element — _Chakra UI_
- native quotation semantics; nested footer for attribution — _MVP.css_
- Semantic blockquote — _Mantine_
- No ARIA impact — _Tailwind Typography (prose plugin)_
- Maps to \<blockquote\> — _Tiptap_
- native quotation semantics; footer for attribution — _Tufte CSS_

**Design choices observed:**

- left-border indented quote — _Water.css, awsm.css_
- Composite Blockquote.Root + Content + Caption — _Chakra UI_
- callout-style quote with footer attribution — _MVP.css_
- Decorative quotation block — _Mantine_
- left-border indented quote, classless — _Sakura.css_
- indented quote with cite styling — _Simple.css_
- Element modifier targeting blockquote — _Tailwind Typography (prose plugin)_
- Schema node; keymap Ctrl/Cmd+Shift+B — _Tiptap_
- right-aligned source attribution via blockquote\>footer pattern — _Tufte CSS_
- indented quote block, classless — _new.css_

**Source URLs:**

- [Chakra UI](https://chakra-ui.com/docs/components/blockquote) — `Blockquote`
- [MVP.css](https://andybrewer.github.io/mvp/) — `Blockquote`
- [Mantine](https://mantine.dev/core/blockquote/) — `Blockquote`
- [Sakura.css](https://github.com/oxalorg/sakura/blob/master/css/sakura.css) — `Blockquote`
- [Simple.css](https://simplecss.org/demo) — `Blockquote / cite`
- [Tailwind Typography (prose plugin)](https://github.com/tailwindlabs/tailwindcss-typography) — `prose-blockquote`
- [Tiptap](https://tiptap.dev/docs/editor/extensions/nodes/blockquote) — `Blockquote`
- [Tufte CSS](https://edwardtufte.github.io/tufte-css/) — `Blockquote (+ footer attribution)`
- [Water.css](https://watercss.kognise.dev/) — `Blockquote / cite`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Blockquote`
- [new.css](https://newcss.net/demo/) — `Blockquote`

---

### Grid

**Systems including:** 11  |  **Lens:** both  |  **Teseor:** missing

**Category:** layout (all 11 systems)

**Aliases observed:** `FlexGrid`, `Grid`, `SimpleGrid`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `columns` | 4 (Chakra UI, MUI (Material UI), Polaris (Shopify), React Spectrum (Adobe)) |
| `gap` | 4 (Atlassian Design System, Chakra UI, Polaris (Shopify), React Spectrum (Adobe)) |
| `areas` | 2 (Polaris (Shopify), React Spectrum (Adobe)) |
| `children` | 2 (BaseWeb (Uber), React Spectrum (Adobe)) |
| `spacing` | 2 (MUI (Material UI), Mantine) |
| `as` | 1 (Carbon (IBM)) |
| `cols` | 1 (Mantine) |
| `condensed` | 1 (Carbon (IBM)) |
| `container` | 1 (MUI (Material UI)) |
| `direction` | 1 (MUI (Material UI)) |
| `flex` | 1 (Ant Design) |
| `flexGridColumnCount` | 1 (BaseWeb (Uber)) |
| `flexGridColumnGap` | 1 (BaseWeb (Uber)) |
| `flexGridRowGap` | 1 (BaseWeb (Uber)) |
| `fullWidth` | 1 (Carbon (IBM)) |
| `gutter` | 1 (Ant Design) |
| `item` | 1 (MUI (Material UI)) |
| `minChildWidth` | 1 (Chakra UI) |
| `narrow` | 1 (Carbon (IBM)) |
| `offset` | 1 (Ant Design) |
| `order` | 1 (Ant Design) |
| `rows` | 1 (React Spectrum (Adobe)) |
| `span` | 1 (Ant Design) |
| `templateAreas` | 1 (Atlassian Design System) |
| `templateColumns` | 1 (Atlassian Design System) |
| `templateRows` | 1 (Atlassian Design System) |
| `verticalSpacing` | 1 (Mantine) |
| `xs\|sm\|md\|lg\|xl` | 1 (MUI (Material UI)) |

**Design choices observed:**

- 24-column Row/Col grid — _Ant Design_
- Direct CSS Grid API with tokens. — _Atlassian Design System_
- Flexbox-based responsive grid with FlexGridItem children — _BaseWeb (Uber)_
- .row + .col-{breakpoint}-{1..12}; auto, equal, offset, gutters utilities — _Bootstrap_
- CSS Grid-based 16/12/8/4 column system; pairs with Column. — _Carbon (IBM)_
- Auto-fit grid using minmax — _Chakra UI_
- Flex/CSS grid hybrid; Grid v2 unified API — _MUI (Material UI)_
- Equal-column responsive grid — _Mantine_
- class-based .grid auto-columns via display:grid — _Pico.css_
- Wraps CSS Grid; responsive columns object. — _Polaris (Shopify)_
- CSS Grid primitive with template areas via tokens — _React Spectrum (Adobe)_

**Source URLs:**

- [Ant Design](https://ant.design/components/grid) — `Grid`
- [Atlassian Design System](https://atlassian.design/components/primitives/grid/examples) — `Grid`
- [BaseWeb (Uber)](https://baseweb.design/components/flex-grid/) — `FlexGrid`
- [Bootstrap](https://getbootstrap.com/docs/5.3/layout/grid/) — `Grid`
- [Carbon (IBM)](https://carbondesignsystem.com/elements/2x-grid/overview/) — `Grid`
- [Chakra UI](https://chakra-ui.com/docs/components/simple-grid) — `SimpleGrid`
- [MUI (Material UI)](https://mui.com/material-ui/react-grid/) — `Grid`
- [Mantine](https://mantine.dev/core/simple-grid/) — `SimpleGrid`
- [Pico.css](https://picocss.com/docs/grid) — `Grid`
- [Polaris (Shopify)](https://polaris.shopify.com/components/layout-and-structure/grid) — `Grid`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Grid.html) — `Grid`

---

### Steps

**Systems including:** 10  |  **Lens:** both  |  **Teseor:** missing

**Category mix:** composite×8, layout×2

**Aliases observed:** `Step`, `Stepper`, `Steps`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `orientation` | 5 (Ark UI, BaseWeb (Uber), Chakra UI, MUI (Material UI), Mantine) |
| `count` | 2 (Ark UI, Chakra UI) |
| `current` | 2 (Ant Design, BaseWeb (Uber)) |
| `linear` | 2 (Ark UI, Chakra UI) |
| `onStepChange` | 2 (Ark UI, Chakra UI) |
| `step` | 2 (Ark UI, Chakra UI) |
| `active` | 1 (Mantine) |
| `activeStep` | 1 (MUI (Material UI)) |
| `allowNextStepsSelect` | 1 (Mantine) |
| `alternativeLabel` | 1 (MUI (Material UI)) |
| `children` | 1 (BaseWeb (Uber)) |
| `connector` | 1 (MUI (Material UI)) |
| `defaultStep` | 1 (Ark UI) |
| `direction` | 1 (Ant Design) |
| `icon` | 1 (Mintlify) |
| `iconType` | 1 (Mintlify) |
| `items` | 1 (Ant Design) |
| `noAnchor` | 1 (Mintlify) |
| `nonLinear` | 1 (MUI (Material UI)) |
| `onChange` | 1 (BaseWeb (Uber)) |
| `onStepClick` | 1 (Mantine) |
| `size` | 1 (Ant Design) |
| `status` | 1 (Ant Design) |
| `stepNumber` | 1 (Mintlify) |
| `title` | 1 (Mintlify) |
| `titleSize` | 1 (Mintlify) |
| `type` | 1 (Ant Design) |

**A11y / ARIA observations:**

- aria-current=step — _Ant Design_
- Tab-pattern with aria-current=step on active item — _Ark UI_
- Wraps semantic ordered list; inherits ol semantics — _Astro Starlight_
- Step list with aria-current=step — _BaseWeb (Uber)_
- ol semantics; aria-current=step — _Chakra UI_
- step indicator with aria-current=step — _MUI (Material UI)_
- aria-current=step on active step — _Mantine_
- Auto-anchored for direct linking; noAnchor opt-out — _Mintlify_
- Uses semantic h2-h6 headings for each step; preserves screen-reader structure. — _Nextra_
- Ordered list semantics — _daisyUI_

**Design choices observed:**

- type=default|navigation|inline — _Ant Design_
- Part-based (Root/List/Item/Trigger/Indicator/Separator/Content/NextTrigger/PrevTrigger/Progress) — _Ark UI_
- Zero-prop; styles a Markdown ol with numbered indicators — _Astro Starlight_
- Newer composite that supersedes ProgressSteps for multi-step flows — _BaseWeb (Uber)_
- Composite Steps.\* parts (List, Item, Trigger, Indicator, Content) — _Chakra UI_
- Composite Stepper + Step + StepLabel/Content/Button — _MUI (Material UI)_
- Composite Stepper + Stepper.Step + Stepper.Completed — _Mantine_
- Required inside Steps; manual step number override — _Mintlify_
- MDX wrapper that converts wrapped h2-h6 headings into numbered visual steps; no explicit Step sub-component. — _Nextra_
- steps + step + step-{color}; horizontal/vertical progress steps — _daisyUI_

**Source URLs:**

- [Ant Design](https://ant.design/components/steps) — `Steps`
- [Ark UI](https://ark-ui.com/docs/components/steps) — `Steps`
- [Astro Starlight](https://starlight.astro.build/components/steps/) — `Steps`
- [BaseWeb (Uber)](https://baseweb.design/components/stepper/) — `Stepper`
- [Chakra UI](https://chakra-ui.com/docs/components/steps) — `Steps`
- [MUI (Material UI)](https://mui.com/material-ui/react-stepper/) — `Stepper`
- [Mantine](https://mantine.dev/core/stepper/) — `Stepper`
- [Mintlify](https://mintlify.com/docs/components/steps) — `Step`
- [Nextra](https://nextra.site/docs/built-ins/steps) — `Steps`
- [daisyUI](https://daisyui.com/components/steps/) — `Steps`

---

### Icon

**Systems including:** 9  |  **Lens:** both  |  **Teseor:** missing

**Category:** primitive (all 9 systems)

**Aliases observed:** `Icon`, `Icons`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `size` | 6 (Astro Starlight, Atlassian Design System, Carbon (IBM), Chakra UI, Mintlify, React Spectrum (Adobe)) |
| `color` | 5 (Astro Starlight, Chakra UI, MUI (Material UI), Mintlify, React Spectrum (Adobe)) |
| `label` | 2 (Astro Starlight, Atlassian Design System) |
| `accessibilityLabel` | 1 (Polaris (Shopify)) |
| `aria-label` | 1 (React Spectrum (Adobe)) |
| `as` | 1 (Chakra UI) |
| `class` | 1 (Astro Starlight) |
| `className` | 1 (Mintlify) |
| `component` | 1 (MUI (Material UI)) |
| `fill` | 1 (Carbon (IBM)) |
| `fontSize` | 1 (MUI (Material UI)) |
| `glyph` | 1 (Atlassian Design System) |
| `icon` | 1 (Mintlify) |
| `iconType` | 1 (Mintlify) |
| `name` | 1 (Astro Starlight) |
| `primaryColor` | 1 (Atlassian Design System) |
| `renderIcon` | 1 (Carbon (IBM)) |
| `rotate` | 1 (Ant Design) |
| `source` | 1 (Polaris (Shopify)) |
| `spin` | 1 (Ant Design) |
| `tone` | 1 (Polaris (Shopify)) |
| `twoToneColor` | 1 (Ant Design) |
| `type` | 1 (Ant Design) |

**A11y / ARIA observations:**

- aria-hidden default — _Ant Design, Chakra UI_
- Hidden from assistive tech when label omitted; label exposes accessible name — _Astro Starlight_
- label drives sr-only text; empty string hides from AT. — _Atlassian Design System_
- Decorative by default; aria-label for meaningful. — _Carbon (IBM)_
- aria-hidden by default; titleAccess for label — _MUI (Material UI)_
- No documented label prop; decorative by default — _Mintlify_
- Decorative by default; accessibilityLabel makes meaningful. — _Polaris (Shopify)_
- Decorative by default; aria-hidden when no label — _React Spectrum (Adobe)_

**Design choices observed:**

- @ant-design/icons package; SVG components — _Ant Design_
- Built-in Starlight icon set; explicit a11y contract via label prop — _Astro Starlight_
- From @atlaskit/icon; label-required API. — _Atlassian Design System_
- Pulls from @carbon/icons-react. — _Carbon (IBM)_
- Sized SVG wrapper — _Chakra UI_
- SvgIcon wrapper for any path data — _MUI (Material UI)_
- Multi-source icon (Font Awesome / Lucide / Tabler / URL / SVG); library configured in docs.json — _Mintlify_
- Tone-token coloring. — _Polaris (Shopify)_
- Wrapper for Spectrum workflow SVGs — _React Spectrum (Adobe)_

**Source URLs:**

- [Ant Design](https://ant.design/components/icon) — `Icon`
- [Astro Starlight](https://starlight.astro.build/components/icons/) — `Icon`
- [Atlassian Design System](https://atlassian.design/components/icon/examples) — `Icon`
- [Carbon (IBM)](https://github.com/carbon-design-system/carbon/tree/main/packages/react/src/components/Icon) — `Icon`
- [Chakra UI](https://chakra-ui.com/docs/components/icon) — `Icon`
- [MUI (Material UI)](https://mui.com/material-ui/icons/) — `Icons`
- [Mintlify](https://mintlify.com/docs/components/icons) — `Icon`
- [Polaris (Shopify)](https://polaris.shopify.com/components/images-and-icons/icon) — `Icon`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Icon.html) — `Icon`

---

### Details

**Systems including:** 8  |  **Lens:** doc  |  **Teseor:** missing

**Category mix:** composite×7, primitive×1

**Aliases observed:** `Details`, `Details / summary`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `open` | 6 (Docusaurus, MVP.css, Simple.css, Water.css, awsm.css, new.css) |
| `HTMLAttributes` | 1 (Tiptap) |
| `onClickOutside` | 1 (Primer (GitHub)) |
| `openClassName` | 1 (Tiptap) |
| `overlay` | 1 (Primer (GitHub)) |
| `persist` | 1 (Tiptap) |

**A11y / ARIA observations:**

- native disclosure semantics — _MVP.css, Simple.css, Water.css +2 more_
- Native \<details\>/\<summary\> semantics; keyboard toggleable. — _Docusaurus_
- Native \<details\> semantics. — _Primer (GitHub)_
- Maps to \<details\>/\<summary\> semantics — _Tiptap_

**Design choices observed:**

- classless tag-based disclosure — _MVP.css, Water.css_
- Native HTML \<details\> styled by Docusaurus theme; no custom React wrapper required. — _Docusaurus_
- Hook-driven open state (useDetails). — _Primer (GitHub)_
- classless accordion via details — _Simple.css_
- Requires DetailsSummary + DetailsContent siblings — _Tiptap_
- classless disclosure with custom summary marker — _awsm.css_
- classless JS-free dropdown/disclosure — _new.css_

**Source URLs:**

- [Docusaurus](https://docusaurus.io/docs/markdown-features/react#details) — `Details`
- [MVP.css](https://andybrewer.github.io/mvp/) — `Details / summary`
- [Primer (GitHub)](https://primer.style/components/details) — `Details`
- [Simple.css](https://simplecss.org/demo) — `Details / summary`
- [Tiptap](https://tiptap.dev/docs/editor/extensions/nodes/details) — `Details`
- [Water.css](https://watercss.kognise.dev/) — `Details / summary`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Details / summary`
- [new.css](https://newcss.net/usage/elements/) — `Details / summary`

---

### Paragraph

**Systems including:** 8  |  **Lens:** doc  |  **Teseor:** missing

**Category:** primitive (all 8 systems)

**Aliases observed:** `Paragraph`, `Paragraph (p)`, `prose lead`, `prose p`, `prose-lead`, `prose-p`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `HTMLAttributes` | 1 (Tiptap) |

**A11y / ARIA observations:**

- No ARIA impact — _Tailwind Typography (prose plugin)_
- Maps to \<p\> — _Tiptap_

**Design choices observed:**

- classless body text — _MVP.css, Sakura.css, Simple.css, new.css_
- Element modifier targeting lead paragraph (class-based selector) — _Tailwind Typography (prose plugin)_
- Default block — _Tiptap_
- tag-styled body text — _Water.css_
- classless body text; first/last child margins collapse — _awsm.css_

**Source URLs:**

- [MVP.css](https://andybrewer.github.io/mvp/) — `Paragraph (p)`
- [Sakura.css](https://github.com/oxalorg/sakura/blob/master/css/sakura.css) — `Paragraph (p)`
- [Simple.css](https://simplecss.org/demo) — `Paragraph (p)`
- [Tailwind Typography (prose plugin)](https://github.com/tailwindlabs/tailwindcss-typography) — `prose-lead`
- [Tiptap](https://tiptap.dev/docs/editor/extensions/nodes/paragraph) — `Paragraph`
- [Water.css](https://watercss.kognise.dev/) — `Paragraph (p)`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Paragraph (p)`
- [new.css](https://newcss.net/demo/) — `Paragraph (p)`

---

### Tag

**Systems including:** 8  |  **Lens:** both  |  **Teseor:** missing

**Category:** primitive (all 8 systems)

**Aliases observed:** `Tag`, `Tag / InteractionTag`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `onClose` | 3 (Ant Design, Carbon (IBM), Chakra UI) |
| `size` | 3 (Carbon (IBM), Chakra UI, Fluent UI React (v9 / Fluent 2)) |
| `appearance` | 2 (Atlassian Design System, Fluent UI React (v9 / Fluent 2)) |
| `children` | 2 (BaseWeb (Uber), React Spectrum (Adobe)) |
| `closable` | 2 (Ant Design, Chakra UI) |
| `color` | 2 (Ant Design, Atlassian Design System) |
| `disabled` | 2 (Fluent UI React (v9 / Fluent 2), Polaris (Shopify)) |
| `onRemove` | 2 (Polaris (Shopify), React Spectrum (Adobe)) |
| `variant` | 2 (BaseWeb (Uber), Chakra UI) |
| `bordered` | 1 (Ant Design) |
| `closeable` | 1 (BaseWeb (Uber)) |
| `dismissible` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `filter` | 1 (Carbon (IBM)) |
| `href` | 1 (Atlassian Design System) |
| `icon` | 1 (Ant Design) |
| `kind` | 1 (BaseWeb (Uber)) |
| `onActionClick` | 1 (BaseWeb (Uber)) |
| `onClick` | 1 (Polaris (Shopify)) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `removeButtonLabel` | 1 (Atlassian Design System) |
| `renderIcon` | 1 (Carbon (IBM)) |
| `selected` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `shape` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `text` | 1 (Atlassian Design System) |
| `type` | 1 (Carbon (IBM)) |
| `url` | 1 (Polaris (Shopify)) |
| `value` | 1 (Fluent UI React (v9 / Fluent 2)) |

**A11y / ARIA observations:**

- Close button labeled when closable — _Ant Design_
- Remove button labelled. — _Atlassian Design System_
- Close button has aria-label; tag exposed as button when clickable — _BaseWeb (Uber)_
- Dismissable variant exposes labelled remove. — _Carbon (IBM)_
- Close button labeled — _Chakra UI_
- Dismiss button labelled; selectable variant uses aria-pressed — _Fluent UI React (v9 / Fluent 2)_
- Remove button has aria-label including tag text. — _Polaris (Shopify)_
- Listitem within TagGroup; remove button labelled — _React Spectrum (Adobe)_

**Design choices observed:**

- Composite Tag + Tag.CheckableTag — _Ant Design_
- Round, link, removable variants. — _Atlassian Design System_
- Pill primitive; closeable + clickable variants — _BaseWeb (Uber)_
- Variants: filter, selectable, dismissible, operational. — _Carbon (IBM)_
- Composite Tag.Root + StartElement + Label + EndElement + CloseTrigger — _Chakra UI_
- Tag + TagGroup + InteractionTag (with primary/secondary actions) slot families — _Fluent UI React (v9 / Fluent 2)_
- Interactive removable label. — _Polaris (Shopify)_
- Used only inside TagGroup — _React Spectrum (Adobe)_

**Source URLs:**

- [Ant Design](https://ant.design/components/tag) — `Tag`
- [Atlassian Design System](https://atlassian.design/components/tag/examples) — `Tag`
- [BaseWeb (Uber)](https://baseweb.design/components/tag/) — `Tag`
- [Carbon (IBM)](https://carbondesignsystem.com/components/tag/usage/) — `Tag`
- [Chakra UI](https://chakra-ui.com/docs/components/tag) — `Tag`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-tag--docs) — `Tag / InteractionTag`
- [Polaris (Shopify)](https://polaris.shopify.com/components/selection-and-input/tag) — `Tag`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/TagGroup.html) — `Tag`

---

### Carousel

**Systems including:** 7  |  **Lens:** both  |  **Teseor:** missing

**Category mix:** composite×5, complex×2

**Aliases observed:** `Carousel`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `autoplay` | 3 (Ant Design, Ark UI, Chakra UI) |
| `loop` | 2 (Ark UI, Chakra UI) |
| `onPageChange` | 2 (Ark UI, Chakra UI) |
| `orientation` | 2 (Ark UI, shadcn/ui) |
| `page` | 2 (Ark UI, Chakra UI) |
| `slideCount` | 2 (Ark UI, Chakra UI) |
| `activeIndex` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `align` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `arrows` | 1 (Ant Design) |
| `circular` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `defaultPage` | 1 (Ark UI) |
| `dotPosition` | 1 (Ant Design) |
| `draggable` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `effect` | 1 (Ant Design) |
| `infinite` | 1 (Ant Design) |
| `onActiveIndexChange` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `opts` | 1 (shadcn/ui) |
| `plugins` | 1 (shadcn/ui) |
| `setApi` | 1 (shadcn/ui) |
| `slidesPerPage` | 1 (Ark UI) |

**A11y / ARIA observations:**

- aria-roledescription=carousel; controls labeled — _Ant Design_
- WAI-ARIA Carousel pattern with announcer and tablist for indicators — _Ark UI_
- aria-roledescription=carousel via JS plugin; controls labeled — _Bootstrap_
- role=region with aria-roledescription=carousel; controls labeled — _Chakra UI_
- role=region with aria-roledescription=carousel; slide aria-labels — _Fluent UI React (v9 / Fluent 2)_
- Native CSS scroll-snap; keyboard arrow keys scroll — _daisyUI_
- role="region" aria-roledescription="carousel"; slide aria-labels — _shadcn/ui_

**Design choices observed:**

- Built on react-slick — _Ant Design_
- Part-based (Root/ItemGroup/Item/Control/PrevTrigger/NextTrigger/IndicatorGroup/Indicator/Autoplay) — _Ark UI_
- .carousel + .carousel-inner + .carousel-item; data-bs-ride/-slide attributes — _Bootstrap_
- Composite Carousel.\* parts (Root, Slides, Controls) — _Chakra UI_
- Carousel + CarouselCard + CarouselSlider + CarouselNav slots — _Fluent UI React (v9 / Fluent 2)_
- CSS scroll-snap container; carousel + carousel-item + carousel-{center|end|vertical} — _daisyUI_
- Wraps embla-carousel-react; Carousel/Content/Item/Previous/Next parts — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/carousel) — `Carousel`
- [Ark UI](https://ark-ui.com/docs/components/carousel) — `Carousel`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/carousel/) — `Carousel`
- [Chakra UI](https://chakra-ui.com/docs/components/carousel) — `Carousel`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-carousel--docs) — `Carousel`
- [daisyUI](https://daisyui.com/components/carousel/) — `Carousel`
- [shadcn/ui](https://ui.shadcn.com/docs/components/carousel) — `Carousel`

---

### Container

**Systems including:** 7  |  **Lens:** both  |  **Teseor:** missing

**Category:** layout (all 7 systems)

**Aliases observed:** `Container`, `Container (danger)`, `Container (details)`, `Container (info)`, `Container (raw)`, `Container (tip)`, `Container (warning)`, `Containers`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `fluid` | 2 (Chakra UI, Mantine) |
| `centerContent` | 1 (Chakra UI) |
| `disableGutters` | 1 (MUI (Material UI)) |
| `fixed` | 1 (MUI (Material UI)) |
| `maxW` | 1 (Chakra UI) |
| `maxWidth` | 1 (MUI (Material UI)) |
| `size` | 1 (Mantine) |
| `strategy` | 1 (Mantine) |

**A11y / ARIA observations:**

- Pass-through wrapper. — _VitePress_

**Design choices observed:**

- .container / .container-{breakpoint} / .container-fluid responsive wrappers — _Bootstrap_
- Max-width constrained wrapper — _Chakra UI_
- Constrained centered wrapper using breakpoints — _MUI (Material UI)_
- Centered constrained wrapper — _Mantine_
- class-based .container / .container-fluid (semantic build) — _Pico.css_
- 5 container/wrapper layout variants — _Tailwind Plus UI Blocks_
- ::: raw block adds vp-raw class to isolate inner content from VitePress style scope. — _VitePress_

**Source URLs:**

- [Bootstrap](https://getbootstrap.com/docs/5.3/layout/containers/) — `Container`
- [Chakra UI](https://chakra-ui.com/docs/components/container) — `Container`
- [MUI (Material UI)](https://mui.com/material-ui/react-container/) — `Container`
- [Mantine](https://mantine.dev/core/container/) — `Container`
- [Pico.css](https://picocss.com/docs/container) — `Container`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/layout/containers) — `Containers`
- [VitePress](https://vitepress.dev/guide/markdown#custom-containers) — `Container (raw)`

---

### HorizontalRule

**Systems including:** 7  |  **Lens:** doc  |  **Teseor:** missing

**Category:** primitive (all 7 systems)

**Aliases observed:** `Horizontal rule (hr)`, `HorizontalRule`, `prose hr`, `prose-hr`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `HTMLAttributes` | 1 (Tiptap) |

**A11y / ARIA observations:**

- No ARIA impact — _Tailwind Typography (prose plugin)_
- Maps to \<hr\> — _Tiptap_

**Design choices observed:**

- subtle separator — _Water.css, awsm.css, new.css_
- divider — _MVP.css_
- muted divider — _Sakura.css_
- Element modifier targeting horizontal rule — _Tailwind Typography (prose plugin)_
- Triggers on --- markdown shortcut — _Tiptap_

**Source URLs:**

- [MVP.css](https://andybrewer.github.io/mvp/) — `Horizontal rule (hr)`
- [Sakura.css](https://github.com/oxalorg/sakura/blob/master/css/sakura.css) — `Horizontal rule (hr)`
- [Tailwind Typography (prose plugin)](https://github.com/tailwindlabs/tailwindcss-typography) — `prose-hr`
- [Tiptap](https://tiptap.dev/docs/editor/extensions/nodes/horizontal-rule) — `HorizontalRule`
- [Water.css](https://watercss.kognise.dev/) — `Horizontal rule (hr)`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Horizontal rule (hr)`
- [new.css](https://newcss.net/demo/) — `Horizontal rule (hr)`

---

### Kbd

**Systems including:** 7  |  **Lens:** doc  |  **Teseor:** missing

**Category:** primitive (all 7 systems)

**Aliases observed:** `Kbd`, `Keyboard key`, `prose kbd`, `prose-kbd`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `size` | 2 (Chakra UI, Mantine) |
| `children` | 1 (Polaris (Shopify)) |
| `className` | 1 (shadcn/ui) |
| `classNames` | 1 (HeroUI) |
| `keys` | 1 (HeroUI) |
| `variant` | 1 (Chakra UI) |

**A11y / ARIA observations:**

- Semantic \<kbd\> — _Chakra UI, HeroUI, Mantine_
- Native \<kbd\> semantics — _daisyUI, shadcn/ui_
- \<kbd\> semantics implied. — _Polaris (Shopify)_
- No ARIA impact — _Tailwind Typography (prose plugin)_

**Design choices observed:**

- Keyboard token styling — _Chakra UI_
- Renders combination of modifier keys + key — _HeroUI_
- Keyboard token style — _Mantine_
- Visual treatment for key labels. — _Polaris (Shopify)_
- Element modifier targeting keyboard input — _Tailwind Typography (prose plugin)_
- Class API: kbd + kbd-{xs..xl} — _daisyUI_
- Styled native \<kbd\>; Kbd + KbdGroup — _shadcn/ui_

**Source URLs:**

- [Chakra UI](https://chakra-ui.com/docs/components/kbd) — `Kbd`
- [HeroUI](https://heroui.com/en/docs/react/components/kbd) — `Kbd`
- [Mantine](https://mantine.dev/core/kbd/) — `Kbd`
- [Polaris (Shopify)](https://polaris.shopify.com/components/images-and-icons/keyboard-key) — `Keyboard key`
- [Tailwind Typography (prose plugin)](https://github.com/tailwindlabs/tailwindcss-typography) — `prose-kbd`
- [daisyUI](https://daisyui.com/components/kbd/) — `Kbd`
- [shadcn/ui](https://ui.shadcn.com/docs/components/kbd) — `Kbd`

---

### Rating

**Systems including:** 7  |  **Lens:** both  |  **Teseor:** missing

**Category mix:** primitive×5, composite×2

**Aliases observed:** `Rating`, `Rating / RatingDisplay / RatingItem`, `rating`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `value` | 5 (BaseWeb (Uber), Chakra UI, Fluent UI React (v9 / Fluent 2), MUI (Material UI), Mantine) |
| `onChange` | 4 (BaseWeb (Uber), Fluent UI React (v9 / Fluent 2), MUI (Material UI), Mantine) |
| `max` | 3 (Fluent UI React (v9 / Fluent 2), FormKit, MUI (Material UI)) |
| `readOnly` | 3 (Chakra UI, MUI (Material UI), Mantine) |
| `count` | 2 (Chakra UI, Mantine) |
| `size` | 2 (BaseWeb (Uber), Fluent UI React (v9 / Fluent 2)) |
| `step` | 2 (Fluent UI React (v9 / Fluent 2), FormKit) |
| `allowHalf` | 1 (Chakra UI) |
| `color` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `defaultValue` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `fractions` | 1 (Mantine) |
| `icon` | 1 (MUI (Material UI)) |
| `iconFilled` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `iconOutline` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `min` | 1 (FormKit) |
| `name` | 1 (FormKit) |
| `numItems` | 1 (BaseWeb (Uber)) |
| `off-color` | 1 (FormKit) |
| `on-color` | 1 (FormKit) |
| `onValueChange` | 1 (Chakra UI) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `precision` | 1 (MUI (Material UI)) |

**A11y / ARIA observations:**

- role=radiogroup with star options labelled by value — _BaseWeb (Uber)_
- role=radiogroup with hidden radios; arrow-key adjust — _Chakra UI_
- role=radiogroup with aria-valuetext per item; itemLabel for SR — _Fluent UI React (v9 / Fluent 2)_
- Slider role with aria-valuetext describing rating — _FormKit_
- role=radiogroup with hidden radios for each star value — _MUI (Material UI)_
- role=radiogroup; arrow-key adjust — _Mantine_
- Hidden radio inputs for accessibility — _daisyUI_

**Design choices observed:**

- Stateful + Stateless; star or emoticon variants — _BaseWeb (Uber)_
- Composite Rating.\* parts with custom icons — _Chakra UI_
- Rating + RatingItem slot composite; RatingDisplay is read-only variant — _Fluent UI React (v9 / Fluent 2)_
- Pro input; star/heart rating, custom icons via slots — _FormKit_
- Half-step precision, custom icons — _MUI (Material UI)_
- Fractional star rating — _Mantine_
- Group of radio inputs styled as stars/hearts via mask classes; rating + rating-{xs..xl} + rating-half — _daisyUI_

**Source URLs:**

- [BaseWeb (Uber)](https://baseweb.design/components/rating/) — `Rating`
- [Chakra UI](https://chakra-ui.com/docs/components/rating) — `Rating`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-rating--docs) — `Rating / RatingDisplay / RatingItem`
- [FormKit](https://formkit.com/inputs/rating) — `rating`
- [MUI (Material UI)](https://mui.com/material-ui/react-rating/) — `Rating`
- [Mantine](https://mantine.dev/core/rating/) — `Rating`
- [daisyUI](https://daisyui.com/components/rating/) — `Rating`

---

### ScrollArea

**Systems including:** 7  |  **Lens:** both  |  **Teseor:** missing

**Category mix:** composite×3, layout×2, primitive×2

**Aliases observed:** `Scroll Area`, `ScrollArea`, `Scrollable`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `scrollHideDelay` | 5 (Ark UI, Chakra UI, Mantine, Radix UI Primitives, shadcn/ui) |
| `type` | 5 (Ark UI, Base UI, Chakra UI, Mantine, shadcn/ui) |
| `dir` | 3 (Ark UI, Radix UI Primitives, shadcn/ui) |
| `asChild` | 1 (Radix UI Primitives) |
| `focusable` | 1 (Polaris (Shopify)) |
| `horizontal` | 1 (Polaris (Shopify)) |
| `offsetScrollbars` | 1 (Mantine) |
| `onScrolledToBottom` | 1 (Polaris (Shopify)) |
| `scrollbarSize` | 1 (Mantine) |
| `shadow` | 1 (Polaris (Shopify)) |
| `size` | 1 (Chakra UI) |
| `type (auto\|always\|scroll\|hover)` | 1 (Radix UI Primitives) |
| `vertical` | 1 (Polaris (Shopify)) |

**A11y / ARIA observations:**

- Native scroll preserved with custom scrollbar visuals — _Ark UI_
- Native scroll preserved — _Base UI_
- Custom scrollbar with keyboard support — _Chakra UI_
- Keyboard-scrollable area — _Mantine_
- Focusable region when needed. — _Polaris (Shopify)_
- Native scroll preserved; uses native scrollbar a11y semantics — _Radix UI Primitives_
- Radix primitive: native scrolling, custom scrollbar — _shadcn/ui_

**Design choices observed:**

- Part-based (Root/Viewport/Scrollbar/Thumb/Corner) — _Ark UI_
- Part-based (Root/Viewport/Scrollbar/Thumb/Corner/Content) — _Base UI_
- Ark-based custom scrollbar container — _Chakra UI_
- Radix ScrollArea wrapper with autosize variant — _Mantine_
- Managed scroll container with shadow cues. — _Polaris (Shopify)_
- Part-based (Root/Viewport/Scrollbar/Thumb/Corner); custom scrollbars without losing native scroll — _Radix UI Primitives_
- Radix-based; Root/Viewport/Scrollbar/Thumb/Corner parts — _shadcn/ui_

**Source URLs:**

- [Ark UI](https://ark-ui.com/docs/components/scroll-area) — `Scroll Area`
- [Base UI](https://base-ui.com/react/components/scroll-area) — `Scroll Area`
- [Chakra UI](https://chakra-ui.com/docs/components/scroll-area) — `Scroll Area`
- [Mantine](https://mantine.dev/core/scroll-area/) — `ScrollArea`
- [Polaris (Shopify)](https://polaris.shopify.com/components/utilities/scrollable) — `Scrollable`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/scroll-area) — `Scroll Area`
- [shadcn/ui](https://ui.shadcn.com/docs/components/scroll-area) — `Scroll Area`

---

### SearchField

**Systems including:** 7  |  **Lens:** both  |  **Teseor:** missing

**Category mix:** primitive×5, composite×2

**Aliases observed:** `Search`, `Search Field`, `SearchField`, `search`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `placeholder` | 4 (Carbon (IBM), FormKit, Nextra, Pico.css) |
| `onChange` | 3 (HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `onSubmit` | 3 (HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `value` | 3 (HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `label` | 2 (FormKit, HeroUI) |
| `name` | 2 (FormKit, Pico.css) |
| `onClear` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `closeButtonLabelText` | 1 (Carbon (IBM)) |
| `defaultValue` | 1 (React Aria Components) |
| `emptyResult` | 1 (Nextra) |
| `errorText` | 1 (Nextra) |
| `icon` | 1 (React Spectrum (Adobe)) |
| `isClearable` | 1 (HeroUI) |
| `isDisabled` | 1 (React Aria Components) |
| `labelText` | 1 (Carbon (IBM)) |
| `loading` | 1 (Nextra) |
| `renderIcon` | 1 (Carbon (IBM)) |
| `searchOptions` | 1 (Nextra) |
| `size` | 1 (Carbon (IBM)) |
| `type=search` | 1 (Pico.css) |
| `validation` | 1 (FormKit) |

**A11y / ARIA observations:**

- role=search; clear button labelled. — _Carbon (IBM)_
- Native input type=search — _FormKit_
- role=searchbox via input\[type=search\]; clear button labeled — _HeroUI_
- Combobox input; suppresses overlapping props (onChange, value, placeholder etc.) to avoid conflicts. — _Nextra_
- native search semantics, role=search container — _Pico.css_
- type=search semantics; Esc clears — _React Aria Components_
- Native role=searchbox; clear button labelled — _React Spectrum (Adobe)_

**Design choices observed:**

- Built-in clear; sizes sm/md/lg. — _Carbon (IBM)_
- Plain native search input — _FormKit_
- React Aria SearchField with built-in clear — _HeroUI_
- Pagefind-backed client-side search; build-time index, zero runtime JS dependency. — _Nextra_
- pill-shaped variant via tag selector — _Pico.css_
- Part-based (SearchField/Label/Input/Button/FieldError); built-in clear button — _React Aria Components_
- TextField variant with built-in clear and search icon — _React Spectrum (Adobe)_

**Source URLs:**

- [Carbon (IBM)](https://carbondesignsystem.com/components/search/usage/) — `Search`
- [FormKit](https://formkit.com/inputs/search) — `search`
- [HeroUI](https://heroui.com/en/docs/react/components/search-field) — `Search Field`
- [Nextra](https://nextra.site/docs/built-ins/search) — `Search`
- [Pico.css](https://picocss.com/docs/forms/search) — `Search`
- [React Aria Components](https://react-aria.adobe.com/SearchField) — `SearchField`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/SearchField.html) — `SearchField`

---

### Section

**Systems including:** 7  |  **Lens:** doc  |  **Teseor:** missing

**Category mix:** layout×5, primitive×2

**Aliases observed:** `Em`, `Prose`, `Section`, `prose`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `children` | 1 (React Spectrum (Adobe)) |
| `items` | 1 (React Spectrum (Adobe)) |
| `size` | 1 (Chakra UI) |
| `title` | 1 (React Spectrum (Adobe)) |

**A11y / ARIA observations:**

- section semantics — _MVP.css, Simple.css, Tufte CSS, awsm.css_
- Section heading associated to grouped items — _React Spectrum (Adobe)_
- Renders semantic HTML untouched; relies on author markup — _Tailwind Typography (prose plugin)_

**Design choices observed:**

- Typography wrapper for rich HTML content — _Chakra UI_
- centered content block, classless — _MVP.css_
- Grouping primitive used inside Collections — _React Spectrum (Adobe)_
- section wrapper, classless — _Simple.css_
- Root utility applying typographic defaults to descendant elements — _Tailwind Typography (prose plugin)_
- logical groupings of headings + text — _Tufte CSS_
- section+section separation; classless — _awsm.css_

**Source URLs:**

- [Chakra UI](https://chakra-ui.com/docs/components/prose) — `Prose`
- [MVP.css](https://andybrewer.github.io/mvp/) — `Section`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Collections.html) — `Section`
- [Simple.css](https://simplecss.org/demo) — `Section`
- [Tailwind Typography (prose plugin)](https://github.com/tailwindlabs/tailwindcss-typography) — `prose`
- [Tufte CSS](https://edwardtufte.github.io/tufte-css/) — `Section`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Section`

---

### Sidebar

**Systems including:** 7  |  **Lens:** both  |  **Teseor:** missing

**Category mix:** composite×5, layout×1, complex×1

**Aliases observed:** `Navbar`, `Navbars`, `SideNavigation`, `Sidebar`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `activeItemId` | 1 (BaseWeb (Uber)) |
| `className` | 1 (Catalyst (Tailwind Labs)) |
| `collapsible` | 1 (shadcn/ui) |
| `defaultOpen` | 1 (shadcn/ui) |
| `isBlurred` | 1 (HeroUI) |
| `isBordered` | 1 (HeroUI) |
| `isMenuOpen` | 1 (HeroUI) |
| `items` | 1 (BaseWeb (Uber)) |
| `maxWidth` | 1 (HeroUI) |
| `onChange` | 1 (BaseWeb (Uber)) |
| `onMenuOpenChange` | 1 (HeroUI) |
| `onOpenChange` | 1 (shadcn/ui) |
| `open` | 1 (shadcn/ui) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `position` | 1 (HeroUI) |
| `side` | 1 (shadcn/ui) |
| `variant` | 1 (shadcn/ui) |

**A11y / ARIA observations:**

- Nav landmark; aria-current on active item — _BaseWeb (Uber)_
- Semantic \<nav\>; aria-expanded on toggler — _Bootstrap_
- nav semantics; mobile drawer integration — _Catalyst (Tailwind Labs)_
- Semantic nav; toggle button has aria-expanded — _HeroUI_
- Disclosure/Menu via Headless UI for mobile nav and user menus — _Tailwind Plus UI Blocks_
- Keyboard shortcut cmd/ctrl+b; semantic nav; mobile vs desktop modes — _shadcn/ui_

**Design choices observed:**

- Vertical nav with nested item support — _BaseWeb (Uber)_
- .navbar + .navbar-brand/-nav/-toggler/.collapse.navbar-collapse; responsive expand classes — _Bootstrap_
- Sidebar + SidebarHeader + SidebarBody + SidebarFooter + SidebarSection + SidebarItem + SidebarLabel + SidebarHeading + SidebarDivider + SidebarSpacer + SidebarLayout shell — _Catalyst (Tailwind Labs)_
- Composite Navbar + Brand + Content + Item + Menu/MenuToggle/MenuItem — _HeroUI_
- 11 application navbar variants — _Tailwind Plus UI Blocks_
- navbar + navbar-{start|center|end} three-section flex layout — _daisyUI_
- Compositional system: Provider/Sidebar/Header/Content/Footer/Group/Menu/Item/Button/Sub/Trigger/Rail; CSS-variable themed — _shadcn/ui_

**Source URLs:**

- [BaseWeb (Uber)](https://baseweb.design/components/side-navigation/) — `SideNavigation`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/navbar/) — `Navbar`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/sidebar) — `Sidebar`
- [HeroUI](https://heroui.com/en/docs/react/components/navbar) — `Navbar`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/navigation/navbars) — `Navbars`
- [daisyUI](https://daisyui.com/components/navbar/) — `Navbar`
- [shadcn/ui](https://ui.shadcn.com/docs/components/sidebar) — `Sidebar`

---

### DescriptionList

**Systems including:** 6  |  **Lens:** doc  |  **Teseor:** missing

**Category mix:** primitive×4, layout×2

**Aliases observed:** `Definition list (dl, dt, dd)`, `Description Lists`, `Description list`, `prose dd`, `prose dl`, `prose dt`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `className` | 1 (Catalyst (Tailwind Labs)) |
| `gap` | 1 (Polaris (Shopify)) |
| `items` | 1 (Polaris (Shopify)) |

**A11y / ARIA observations:**

- native description list semantics — _awsm.css, new.css_
- Native \<dl\>/\<dt\>/\<dd\> semantics — _Catalyst (Tailwind Labs)_
- Native \<dl\>\<dt\>\<dd\>. — _Polaris (Shopify)_
- Native dl/dt/dd semantics — _Tailwind Plus UI Blocks_
- Native definition description semantics — _Tailwind Typography (prose plugin)_

**Design choices observed:**

- classless dl styling — _awsm.css, new.css_
- DescriptionList + DescriptionTerm + DescriptionDetails over native dl — _Catalyst (Tailwind Labs)_
- Token-driven dl wrapper. — _Polaris (Shopify)_
- 6 description-list variants — _Tailwind Plus UI Blocks_
- Styles description inside description list — _Tailwind Typography (prose plugin)_

**Source URLs:**

- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/description-list) — `Description list`
- [Polaris (Shopify)](https://polaris.shopify.com/components/lists/description-list) — `Description list`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/data-display/description-lists) — `Description Lists`
- [Tailwind Typography (prose plugin)](https://github.com/tailwindlabs/tailwindcss-typography) — `prose dd`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Definition list (dl, dt, dd)`
- [new.css](https://newcss.net/demo/) — `Definition list (dl, dt, dd)`

---

### Figure

**Systems including:** 6  |  **Lens:** doc  |  **Teseor:** missing

**Category mix:** layout×5, primitive×1

**Aliases observed:** `Figure`, `Figure / figcaption`, `prose figcaption`, `prose figure`, `prose-figcaption`, `prose-figure`

**A11y / ARIA observations:**

- figure + figcaption association — _MVP.css, Simple.css, Tufte CSS, awsm.css_
- figure with figcaption for caption association — _Pico.css_
- No ARIA impact — _Tailwind Typography (prose plugin)_

**Design choices observed:**

- image-with-caption callout — _MVP.css_
- classless figure wrapper for tables/images with overflow scroll on inner table — _Pico.css_
- wraps images and overflow tables — _Simple.css_
- Element modifier targeting figure caption — _Tailwind Typography (prose plugin)_
- main-column figure with caption — _Tufte CSS_
- media-with-caption block — _awsm.css_

**Source URLs:**

- [MVP.css](https://andybrewer.github.io/mvp/) — `Figure / figcaption`
- [Pico.css](https://picocss.com/docs/figure) — `Figure / figcaption`
- [Simple.css](https://simplecss.org/demo) — `Figure / figcaption`
- [Tailwind Typography (prose plugin)](https://github.com/tailwindlabs/tailwindcss-typography) — `prose-figcaption`
- [Tufte CSS](https://edwardtufte.github.io/tufte-css/) — `Figure`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Figure / figcaption`

---

### Footer

**Systems including:** 6  |  **Lens:** both  |  **Teseor:** missing

**Category mix:** layout×5, primitive×1

**Aliases observed:** `Footer`, `Footers`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `children` | 1 (React Spectrum (Adobe)) |
| `slot` | 1 (React Spectrum (Adobe)) |

**A11y / ARIA observations:**

- footer landmark — _MVP.css, Simple.css_
- Live region — announced to screen readers — _React Day Picker_
- Maps to footer/contentinfo when used as landmark slot — _React Spectrum (Adobe)_
- Native \<footer\> semantics — _daisyUI_

**Design choices observed:**

- classless footer block — _MVP.css_
- Slot for status messaging below grid — _React Day Picker_
- Slot used inside Dialog/Card/IllustratedMessage — _React Spectrum (Adobe)_
- classless footer — _Simple.css_
- 7 footer block variants — _Tailwind Plus UI Blocks_
- footer + footer-title + footer-{center|horizontal|vertical} grid layout — _daisyUI_

**Source URLs:**

- [MVP.css](https://andybrewer.github.io/mvp/) — `Footer`
- [React Day Picker](https://daypicker.dev/guides/custom-components) — `Footer`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Footer.html) — `Footer`
- [Simple.css](https://simplecss.org/demo) — `Footer`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/marketing/sections/footers) — `Footers`
- [daisyUI](https://daisyui.com/components/footer/) — `Footer`

---

### Header

**Systems including:** 6  |  **Lens:** both  |  **Teseor:** missing

**Category mix:** layout×3, composite×2, primitive×1

**Aliases observed:** `Header`, `Headers (Marketing Elements)`, `Page header`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `actions` | 1 (Atlassian Design System) |
| `bottomBar` | 1 (Atlassian Design System) |
| `breadcrumbs` | 1 (Atlassian Design System) |
| `column` | 1 (TanStack Table) |
| `disableTitleStyles` | 1 (Atlassian Design System) |
| `getContext()` | 1 (TanStack Table) |
| `getSize()` | 1 (TanStack Table) |
| `id` | 1 (TanStack Table) |
| `isPlaceholder` | 1 (TanStack Table) |

**A11y / ARIA observations:**

- header landmark — _MVP.css, new.css_
- Title is h1 unless disabled. — _Atlassian Design System_
- header landmark, often contains nav — _Simple.css_
- Disclosure/Popover for mobile menus — _Tailwind Plus UI Blocks_
- Caller renders \<th\> with columnheader role — _TanStack Table_

**Design choices observed:**

- Composite slots for breadcrumbs/actions/bottom bar. — _Atlassian Design System_
- centered hero-style header block — _MVP.css_
- full-bleed page header styled block — _Simple.css_
- 11 marketing header element variants; mobile nav via Headless UI — _Tailwind Plus UI Blocks_
- Single header cell descriptor — _TanStack Table_
- page-level styled header block — _new.css_

**Source URLs:**

- [Atlassian Design System](https://atlassian.design/components/page-header/examples) — `Page header`
- [MVP.css](https://andybrewer.github.io/mvp/) — `Header`
- [Simple.css](https://simplecss.org/demo) — `Header`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/marketing/elements/headers) — `Headers (Marketing Elements)`
- [TanStack Table](https://tanstack.com/table/latest/docs/api/core/header) — `Header`
- [new.css](https://newcss.net/usage/elements/) — `Header`

---

### Nav

**Systems including:** 6  |  **Lens:** both  |  **Teseor:** missing

**Category mix:** layout×5, composite×1

**Aliases observed:** `Nav`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `density` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `multiple` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `onNavItemSelect` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `openCategories` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `selectedValue` | 1 (Fluent UI React (v9 / Fluent 2)) |

**A11y / ARIA observations:**

- nav landmark with ul/li — _MVP.css, awsm.css_
- nav landmark; NavItem aria-current when selected; sub-nav aria-expanded — _Fluent UI React (v9 / Fluent 2)_
- nav landmark; ul/li lists — _Pico.css_
- Wraps prev/next buttons — _React Day Picker_
- nav landmark — _Simple.css_

**Design choices observed:**

- Nav + NavCategory + NavCategoryItem + NavSubItem + NavSectionHeader composite — _Fluent UI React (v9 / Fluent 2)_
- horizontal nav via nav\>ul, classless — _MVP.css_
- horizontal nav via nav\>ul, supports left/right sections — _Pico.css_
- Navigation slot — _React Day Picker_
- horizontal pill-style nav inside header — _Simple.css_
- horizontal nav with hover/visited link states — _awsm.css_

**Source URLs:**

- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-nav-nav--docs) — `Nav`
- [MVP.css](https://andybrewer.github.io/mvp/) — `Nav`
- [Pico.css](https://picocss.com/docs/nav) — `Nav`
- [React Day Picker](https://daypicker.dev/guides/custom-components) — `Nav`
- [Simple.css](https://simplecss.org/demo) — `Nav`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Nav`

---

### Timeline

**Systems including:** 6  |  **Lens:** doc  |  **Teseor:** missing

**Category mix:** composite×5, layout×1

**Aliases observed:** `Timeline`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `active` | 1 (Mantine) |
| `align` | 1 (MUI (Material UI)) |
| `bulletSize` | 1 (Mantine) |
| `clipSidebar` | 1 (Primer (GitHub)) |
| `color` | 1 (Mantine) |
| `items` | 1 (Ant Design) |
| `lineWidth` | 1 (Mantine) |
| `mode` | 1 (Ant Design) |
| `pending` | 1 (Ant Design) |
| `position` | 1 (MUI (Material UI)) |
| `reverse` | 1 (Ant Design) |
| `size` | 1 (Chakra UI) |
| `variant` | 1 (Chakra UI) |

**A11y / ARIA observations:**

- ol semantics — _Ant Design, MUI (Material UI), Mantine_
- ol/li semantics — _Chakra UI_
- List + item semantics. — _Primer (GitHub)_

**Design choices observed:**

- Items-prop API with custom dot/label/color — _Ant Design_
- Composite Timeline.Root + Item + Connector + Indicator + Content + Title — _Chakra UI_
- Lab; composite Timeline + Item + Separator/Dot/Connector/Content — _MUI (Material UI)_
- Composite Timeline + Timeline.Item — _Mantine_
- Compound .Item/.Badge/.Body/.Break. — _Primer (GitHub)_
- timeline + timeline-{start|middle|end} + timeline-{horizontal|vertical|compact|snap-icon} — _daisyUI_

**Source URLs:**

- [Ant Design](https://ant.design/components/timeline) — `Timeline`
- [Chakra UI](https://chakra-ui.com/docs/components/timeline) — `Timeline`
- [MUI (Material UI)](https://mui.com/material-ui/react-timeline/) — `Timeline`
- [Mantine](https://mantine.dev/core/timeline/) — `Timeline`
- [Primer (GitHub)](https://primer.style/components/timeline) — `Timeline`
- [daisyUI](https://daisyui.com/components/timeline/) — `Timeline`

---

## P1 — Core app primitives

12 components.

### Select

**Systems including:** 28  |  **Lens:** app  |  **Teseor:** missing

**Category mix:** primitive×16, composite×12

**Aliases observed:** `Native Select`, `NativeSelect`, `Select`, `Select (Native)`, `select`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `value` | 14 (Ant Design, Ark UI, Atlassian Design System, Base UI +10 more) |
| `disabled` | 12 (Ark UI, Base UI, Carbon (IBM), Catalyst (Tailwind Labs) +8 more) |
| `name` | 8 (Ark UI, Base UI, Catalyst (Tailwind Labs), FormKit +4 more) |
| `multiple` | 7 (Ark UI, Base UI, Chakra UI, FormKit +3 more) |
| `onChange` | 6 (Ant Design, BaseWeb (Uber), Fluent UI React (v9 / Fluent 2), MUI (Material UI), Mantine, Polaris (Shopify)) |
| `defaultValue` | 5 (Ark UI, Base UI, Fluent UI React (v9 / Fluent 2), Radix UI Primitives, shadcn/ui) |
| `onValueChange` | 5 (Ark UI, Base UI, Chakra UI, Radix UI Primitives, shadcn/ui) |
| `options` | 5 (Ant Design, Atlassian Design System, BaseWeb (Uber), FormKit, Polaris (Shopify)) |
| `invalid` | 3 (Carbon (IBM), Catalyst (Tailwind Labs), Headless UI (React)) |
| `items` | 3 (Base UI, HeroUI, React Aria Components) |
| `placeholder` | 3 (FormKit, Primer (GitHub), React Aria Components) |
| `collection` | 2 (Ark UI, Chakra UI) |
| `label` | 2 (FormKit, Polaris (Shopify)) |
| `onSelectionChange` | 2 (HeroUI, React Aria Components) |
| `open` | 2 (Ark UI, Radix UI Primitives) |
| `renderValue` | 2 (HeroUI, MUI (Material UI)) |
| `required` | 2 (Base UI, Radix UI Primitives) |
| `searchable` | 2 (BaseWeb (Uber), Mantine) |
| `allowClear` | 1 (Ant Design) |
| `appearance` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `aria-invalid` | 1 (Pico.css) |
| `as` | 1 (Headless UI (React)) |
| `children` | 1 (Primer (GitHub)) |
| `clearable` | 1 (Mantine) |
| `creatable` | 1 (BaseWeb (Uber)) |
| `data` | 1 (Mantine) |
| `defaultSelectedKey` | 1 (React Aria Components) |
| `dir` | 1 (Radix UI Primitives) |
| `error` | 1 (Polaris (Shopify)) |
| `helperText` | 1 (Carbon (IBM)) |
| `isAsync` | 1 (Atlassian Design System) |
| `isCreatable` | 1 (Atlassian Design System) |
| `isDisabled` | 1 (React Aria Components) |
| `isLoading` | 1 (HeroUI) |
| `isMulti` | 1 (Atlassian Design System) |
| `isRequired` | 1 (React Aria Components) |
| `isSearchable` | 1 (Atlassian Design System) |
| `labelInline` | 1 (Polaris (Shopify)) |
| `labelText` | 1 (Carbon (IBM)) |
| `MenuProps` | 1 (MUI (Material UI)) |
| _… +15 more props_ | |

**A11y / ARIA observations:**

- WAI-ARIA Listbox with typeahead and full keyboard nav — _Ark UI, Base UI_
- Native \<select\> semantics — _Catalyst (Tailwind Labs), Fluent UI React (v9 / Fluent 2)_
- ARIA combobox/listbox — _Ant Design_
- Combobox semantics via react-select base. — _Atlassian Design System_
- combobox/listbox pattern with aria-activedescendant and selected state — _BaseWeb (Uber)_
- Native \<select\> — _Bootstrap_
- Native select; aria-describedby ties help. — _Carbon (IBM)_
- Combobox-style listbox button with aria-expanded/controls — _Chakra UI_
- Native \<select\>; options support objects with label/value/group — _FormKit_
- Wraps native HTML select element (not custom dropdown) — _Headless UI (React)_
- React Aria Select: button + listbox dialog; aria-expanded/controls — _HeroUI_
- ARIA listbox button; expanded/activedescendant — _MUI (Material UI)_
- ARIA combobox button + listbox — _Mantine_
- native select semantics, aria-invalid for state — _Pico.css_
- Native \<select\> semantics; describedby for error/help. — _Polaris (Shopify)_
- Native select semantics. — _Primer (GitHub)_
- WAI-ARIA Listbox pattern with full keyboard nav and typeahead — _Radix UI Primitives_
- WAI-ARIA Listbox pattern with typeahead — _React Aria Components_
- Native \<select\> wrapper — _React Day Picker_
- Native select semantics — _daisyUI_
- Radix primitive: role="combobox"/"listbox", type-ahead, ARIA selection — _shadcn/ui_

**Design choices observed:**

- classless styled native select — _MVP.css, Pico.css, Sakura.css, Simple.css_
- mode=multiple|tags|combobox; virtual scrolling default — _Ant Design_
- Part-based (Root/Label/Control/Trigger/ValueText/Indicator/Positioner/Content/ItemGroup/ItemGroupLabel/Item/ItemText/ItemIndicator/ClearTrigger/HiddenSelect); collection model — _Ark UI_
- Wraps react-select; Async/Creatable variants. — _Atlassian Design System_
- Part-based (Root/Trigger/Value/Icon/Portal/Backdrop/Positioner/Popup/List/Item/ItemText/ItemIndicator/Group/GroupLabel/Separator/ScrollUpArrow/ScrollDownArrow); hidden native input for forms — _Base UI_
- Stateful + Stateless; search, creatable, multi, async modes via flags — _BaseWeb (Uber)_
- .form-select with size modifiers; multiple/htmlSize supported — _Bootstrap_
- Uses native select; pairs with SelectItem/SelectItemGroup. — _Carbon (IBM)_
- Styled native select (not Headless UI Listbox); used inside Field — _Catalyst (Tailwind Labs)_
- Composite Select.\* parts; uses collection abstraction — _Chakra UI_
- Styled wrapper around native \<select\> (separate from Dropdown for native flow) — _Fluent UI React (v9 / Fluent 2)_
- Native select; supports option groups and placeholder — _FormKit_
- Native select wrapper; data-\* attribute styling hooks — _Headless UI (React)_
- Composite Select + SelectSection + SelectItem; multi-select supported — _HeroUI_
- Native vs custom Popper; multiple-select — _MUI (Material UI)_
- Built on Combobox with single value — _Mantine_
- Native select wrapper, not custom listbox. — _Polaris (Shopify)_
- Thin wrapper over native select. — _Primer (GitHub)_
- Part-based (Root/Trigger/Value/Icon/Portal/Content/Viewport/Item/ItemText/ItemIndicator/Group/Label/Separator/Scroll\*); hidden native select for forms — _Radix UI Primitives_
- Part-based (Select/Label/Button/SelectValue/Popover/ListBox/ListBoxItem); key-based selection — _React Aria Components_
- Shared select atom — _React Day Picker_
- tag-styled native select — _Water.css_
- classless styled native select with hover/disabled states — _awsm.css_
- Class on native \<select\>: select + select-{color|ghost} + select-{xs..xl} — _daisyUI_
- Radix-based; Trigger/Value/Content/Item/Group/Label parts; position=item-aligned|popper — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/select) — `Select`
- [Ark UI](https://ark-ui.com/docs/components/select) — `Select`
- [Atlassian Design System](https://atlassian.design/components/select/examples) — `Select`
- [Base UI](https://base-ui.com/react/components/select) — `Select`
- [BaseWeb (Uber)](https://baseweb.design/components/select/) — `Select`
- [Bootstrap](https://getbootstrap.com/docs/5.3/forms/select/) — `Select`
- [Carbon (IBM)](https://carbondesignsystem.com/components/select/usage/) — `Select`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/select) — `Select`
- [Chakra UI](https://chakra-ui.com/docs/components/select) — `Select`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-select--docs) — `Select`
- [FormKit](https://formkit.com/inputs/select) — `select`
- [Headless UI (React)](https://headlessui.com/react/select) — `Select`
- [HeroUI](https://heroui.com/en/docs/react/components/select) — `Select`
- [MUI (Material UI)](https://mui.com/material-ui/react-select/) — `Select`
- [MVP.css](https://andybrewer.github.io/mvp/) — `Select`
- [Mantine](https://mantine.dev/core/select/) — `Select`
- [Pico.css](https://picocss.com/docs/forms/select) — `Select`
- [Polaris (Shopify)](https://polaris.shopify.com/components/selection-and-input/select) — `Select`
- [Primer (GitHub)](https://primer.style/components/select) — `Select`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/select) — `Select`
- [React Aria Components](https://react-aria.adobe.com/Select) — `Select`
- [React Day Picker](https://daypicker.dev/guides/custom-components) — `Select`
- [Sakura.css](https://github.com/oxalorg/sakura/blob/master/css/sakura.css) — `Select`
- [Simple.css](https://simplecss.org/demo) — `Select`
- [Water.css](https://watercss.kognise.dev/) — `Select`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Select`
- [daisyUI](https://daisyui.com/components/select/) — `Select`
- [shadcn/ui](https://ui.shadcn.com/docs/components/select) — `Select`

---

### Checkbox

**Systems including:** 25  |  **Lens:** app  |  **Teseor:** missing

**Category:** primitive (all 25 systems)

**Aliases observed:** `Checkbox`, `Checkbox / radio`, `checkbox`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `checked` | 17 (Ant Design, Ark UI, Base UI, BaseWeb (Uber) +13 more) |
| `disabled` | 12 (Ant Design, Ark UI, Base UI, Carbon (IBM) +8 more) |
| `indeterminate` | 10 (Ant Design, Ark UI, Base UI, Carbon (IBM) +6 more) |
| `defaultChecked` | 9 (Ark UI, Base UI, Catalyst (Tailwind Labs), Fluent UI React (v9 / Fluent 2) +5 more) |
| `onChange` | 9 (Ant Design, BaseWeb (Uber), Fluent UI React (v9 / Fluent 2), Headless UI (React) +5 more) |
| `name` | 8 (Ark UI, Base UI, Catalyst (Tailwind Labs), FormKit +4 more) |
| `value` | 6 (Ark UI, Catalyst (Tailwind Labs), FormKit, Headless UI (React), Radix UI Primitives, React Aria Components) |
| `isIndeterminate` | 5 (Atlassian Design System, BaseWeb (Uber), HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `onCheckedChange` | 5 (Ark UI, Base UI, Chakra UI, Radix UI Primitives, shadcn/ui) |
| `color` | 3 (Catalyst (Tailwind Labs), HeroUI, MUI (Material UI)) |
| `isDisabled` | 3 (Atlassian Design System, React Aria Components, React Spectrum (Adobe)) |
| `isSelected` | 3 (HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `label` | 3 (FormKit, Mantine, Polaris (Shopify)) |
| `required` | 3 (Ark UI, Base UI, Radix UI Primitives) |
| `size` | 3 (Fluent UI React (v9 / Fluent 2), HeroUI, MUI (Material UI)) |
| `defaultSelected` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `error` | 2 (Mantine, Polaris (Shopify)) |
| `invalid` | 2 (Carbon (IBM), Chakra UI) |
| `type=checkbox\|radio` | 2 (Water.css, awsm.css) |
| `checkmarkType` | 1 (BaseWeb (Uber)) |
| `form` | 1 (Headless UI (React)) |
| `helpText` | 1 (Polaris (Shopify)) |
| `isChecked` | 1 (Atlassian Design System) |
| `isInvalid` | 1 (Atlassian Design System) |
| `isReadOnly` | 1 (React Spectrum (Adobe)) |
| `isRequired` | 1 (React Aria Components) |
| `labelPlacement` | 1 (BaseWeb (Uber)) |
| `labelPosition` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `labelText` | 1 (Carbon (IBM)) |
| `off-value` | 1 (FormKit) |
| `on-value` | 1 (FormKit) |
| `onValueChange` | 1 (HeroUI) |
| `options` | 1 (FormKit) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `radius` | 1 (HeroUI) |
| `shape` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `type=checkbox` | 1 (Sakura.css) |
| `validationStatus` | 1 (Primer (GitHub)) |
| `warn` | 1 (Carbon (IBM)) |

**A11y / ARIA observations:**

- Tri-state checkbox with Space toggle — _Ark UI, Base UI, Headless UI (React)_
- Native input\[type=checkbox\]; aria-checked=mixed for indeterminate — _BaseWeb (Uber), React Spectrum (Adobe)_
- native checkbox semantics — _Pico.css, Sakura.css_
- native checkbox/radio semantics — _Water.css, awsm.css_
- Native checkbox; aria-checked=mixed — _Ant Design_
- aria-checked with indeterminate; pairs with Form Field. — _Atlassian Design System_
- Native input; indeterminate supported. — _Carbon (IBM)_
- Wraps Headless UI Checkbox — _Catalyst (Tailwind Labs)_
- Native checkbox; aria-checked=mixed for indeterminate — _Chakra UI_
- Native input\[type=checkbox\]; aria-checked=mixed for mixed state — _Fluent UI React (v9 / Fluent 2)_
- Single checkbox auto-labeled; multi-option exposes group via fieldset/legend — _FormKit_
- React Aria Checkbox: aria-checked mixed for indeterminate — _HeroUI_
- Native input\[type=checkbox\]; indeterminate via aria-checked=mixed — _MUI (Material UI)_
- Native checkbox; indeterminate aria-checked=mixed — _Mantine_
- aria-describedby for help/error; indeterminate supported. — _Polaris (Shopify)_
- Native input semantics; indeterminate supported. — _Primer (GitHub)_
- Tri-state Checkbox WAI-ARIA pattern; Space toggles; indeterminate supported — _Radix UI Primitives_
- Tri-state checkbox semantics; aria-invalid + validation messages — _React Aria Components_
- Native checkbox semantics — _daisyUI_
- Radix primitive: role="checkbox", aria-checked supports indeterminate — _shadcn/ui_

**Design choices observed:**

- Composite Checkbox + Checkbox.Group — _Ant Design, Mantine_
- Part-based (Root/Label/Control/Indicator/HiddenInput) — _Ark UI_
- Controlled; isInvalid drives error styling. — _Atlassian Design System_
- Part-based (Root/Indicator/HiddenInput); render-prop state via data-\* attrs — _Base UI_
- Stateful + Stateless; supports toggle and standard checkmark variants — _BaseWeb (Uber)_
- Controlled or uncontrolled; warn variant. — _Carbon (IBM)_
- CheckboxGroup + CheckboxField for form composition; indeterminate supported — _Catalyst (Tailwind Labs)_
- Composite Checkbox.Root + HiddenInput + Control + Label — _Chakra UI_
- Mixed state via boolean | 'mixed'; circular shape variant — _Fluent UI React (v9 / Fluent 2)_
- One component handles single boolean and multi-option (array) checkbox group via options prop — _FormKit_
- Standalone primitive (no Indicator child); render-prop state; Field/Label compose — _Headless UI (React)_
- Tailwind variants via tv() — _HeroUI_
- Controlled+uncontrolled; indeterminate state — _MUI (Material UI)_
- label-wrapped pattern, classless — _Pico.css_
- Controlled; tri-state via checked='indeterminate'. — _Polaris (Shopify)_
- Pairs with FormControl for label/help. — _Primer (GitHub)_
- Root/Indicator parts; hidden native input for forms; asChild slot — _Radix UI Primitives_
- Render-prop state; CheckboxGroup companion for grouped selection — _React Aria Components_
- Controlled or uncontrolled; supports validate prop — _React Spectrum (Adobe)_
- classless native checkbox with focus outline — _Sakura.css_
- accent-color recolored native inputs — _Water.css_
- classless native inputs paired with label — _awsm.css_
- Class on native \<input type=checkbox\>: checkbox + checkbox-{color} + checkbox-{xs..xl} — _daisyUI_
- Radix-based; tri-state via 'indeterminate' value — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/checkbox) — `Checkbox`
- [Ark UI](https://ark-ui.com/docs/components/checkbox) — `Checkbox`
- [Atlassian Design System](https://atlassian.design/components/checkbox/examples) — `Checkbox`
- [Base UI](https://base-ui.com/react/components/checkbox) — `Checkbox`
- [BaseWeb (Uber)](https://baseweb.design/components/checkbox/) — `Checkbox`
- [Carbon (IBM)](https://carbondesignsystem.com/components/checkbox/usage/) — `Checkbox`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/checkbox) — `Checkbox`
- [Chakra UI](https://chakra-ui.com/docs/components/checkbox) — `Checkbox`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-checkbox--docs) — `Checkbox`
- [FormKit](https://formkit.com/inputs/checkbox) — `checkbox`
- [Headless UI (React)](https://headlessui.com/react/checkbox) — `Checkbox`
- [HeroUI](https://heroui.com/en/docs/react/components/checkbox) — `Checkbox`
- [MUI (Material UI)](https://mui.com/material-ui/react-checkbox/) — `Checkbox`
- [Mantine](https://mantine.dev/core/checkbox/) — `Checkbox`
- [Pico.css](https://picocss.com/docs/forms/checkboxes-radios-switches) — `Checkbox`
- [Polaris (Shopify)](https://polaris.shopify.com/components/selection-and-input/checkbox) — `Checkbox`
- [Primer (GitHub)](https://primer.style/components/checkbox) — `Checkbox`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/checkbox) — `Checkbox`
- [React Aria Components](https://react-aria.adobe.com/Checkbox) — `Checkbox`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Checkbox.html) — `Checkbox`
- [Sakura.css](https://github.com/oxalorg/sakura/blob/master/css/sakura.css) — `Checkbox`
- [Water.css](https://watercss.kognise.dev/) — `Checkbox / radio`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Checkbox / radio`
- [daisyUI](https://daisyui.com/components/checkbox/) — `Checkbox`
- [shadcn/ui](https://ui.shadcn.com/docs/components/checkbox) — `Checkbox`

---

### Input

**Systems including:** 25  |  **Lens:** app  |  **Teseor:** missing

**Category mix:** primitive×22, composite×3

**Aliases observed:** `Input`, `Input (text family)`, `Text Field`, `Text Input`, `Text field`, `TextField`, `TextInput`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `type` | 13 (BaseWeb (Uber), Catalyst (Tailwind Labs), Fluent UI React (v9 / Fluent 2), Headless UI (React) +9 more) |
| `value` | 13 (Ant Design, Base UI, BaseWeb (Uber), Chakra UI +9 more) |
| `onChange` | 10 (Ant Design, BaseWeb (Uber), Chakra UI, Fluent UI React (v9 / Fluent 2) +6 more) |
| `placeholder` | 7 (Carbon (IBM), Chakra UI, MVP.css, Pico.css +3 more) |
| `disabled` | 6 (Base UI, Catalyst (Tailwind Labs), Headless UI (React), Pico.css, Water.css, shadcn/ui) |
| `size` | 6 (Ant Design, BaseWeb (Uber), Carbon (IBM), Chakra UI, Fluent UI React (v9 / Fluent 2), Primer (GitHub)) |
| `label` | 5 (HeroUI, MUI (Material UI), Mantine, Polaris (Shopify), React Spectrum (Adobe)) |
| `error` | 4 (BaseWeb (Uber), MUI (Material UI), Mantine, Polaris (Shopify)) |
| `invalid` | 4 (Carbon (IBM), Catalyst (Tailwind Labs), Chakra UI, Headless UI (React)) |
| `defaultValue` | 3 (Base UI, Fluent UI React (v9 / Fluent 2), React Aria Components) |
| `description` | 3 (HeroUI, Mantine, React Spectrum (Adobe)) |
| `isInvalid` | 3 (Atlassian Design System, HeroUI, React Aria Components) |
| `name` | 3 (Catalyst (Tailwind Labs), Pico.css, Water.css) |
| `appearance` | 2 (Atlassian Design System, Fluent UI React (v9 / Fluent 2)) |
| `aria-invalid` | 2 (Pico.css, shadcn/ui) |
| `errorMessage` | 2 (HeroUI, React Spectrum (Adobe)) |
| `isRequired` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `prefix` | 2 (Ant Design, Polaris (Shopify)) |
| `suffix` | 2 (Ant Design, Polaris (Shopify)) |
| `validate` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `variant` | 2 (Chakra UI, MUI (Material UI)) |
| `allowClear` | 1 (Ant Design) |
| `as` | 1 (Headless UI (React)) |
| `contentAfter` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `contentBefore` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `elemAfterInput` | 1 (Atlassian Design System) |
| `elemBeforeInput` | 1 (Atlassian Design System) |
| `enableCounter` | 1 (Carbon (IBM)) |
| `endEnhancer` | 1 (BaseWeb (Uber)) |
| `helperText` | 1 (MUI (Material UI)) |
| `InputProps` | 1 (MUI (Material UI)) |
| `isCompact` | 1 (Atlassian Design System) |
| `isDisabled` | 1 (React Aria Components) |
| `isReadOnly` | 1 (React Aria Components) |
| `labelText` | 1 (Carbon (IBM)) |
| `leadingVisual` | 1 (Primer (GitHub)) |
| `leftSection` | 1 (Mantine) |
| `loading` | 1 (Primer (GitHub)) |
| `multiline` | 1 (Polaris (Shopify)) |
| `onValueChange` | 1 (Base UI) |
| _… +9 more props_ | |

**A11y / ARIA observations:**

- native input semantics — _MVP.css, Sakura.css, Simple.css +3 more_
- Native input; status maps to aria-invalid — _Ant Design_
- Pairs with Form Field for label/help/error. — _Atlassian Design System_
- Native input semantics; aria-invalid inherited from Field context — _Base UI_
- Native input; aria-invalid mirrors error prop — _BaseWeb (Uber)_
- Helper/error linked via aria-describedby. — _Carbon (IBM)_
- aria-invalid wired via invalid prop or Field — _Catalyst (Tailwind Labs)_
- Native input; pair with Field — _Chakra UI_
- Native input; field wrapper supplies aria-describedby — _Fluent UI React (v9 / Fluent 2)_
- Wraps native input; aria-invalid wiring via Field context — _Headless UI (React)_
- React Aria TextField with full label/help/error wiring — _HeroUI_
- Label associated via htmlFor; aria-describedby for helperText/error — _MUI (Material UI)_
- Native input wrapped with Input.Wrapper labels — _Mantine_
- aria-invalid=true/false drives valid/invalid color states; aria-describedby for helper text — _Pico.css_
- Connects label, help, error via aria-describedby. — _Polaris (Shopify)_
- Pairs with FormControl for labels. — _Primer (GitHub)_
- Label/Input/Description/FieldError wiring via aria-describedby/aria-invalid — _React Aria Components_
- Native input with aria-describedby/labelledby; aria-invalid on error — _React Spectrum (Adobe)_
- Native input semantics — _daisyUI_
- aria-invalid for error styling — _shadcn/ui_

**Design choices observed:**

- classless type-aware input — _MVP.css, new.css_
- Composite Input + Input.TextArea + Input.Search + Input.Password + Input.Group + Input.OTP — _Ant Design_
- Affix slots; subtle/none/standard appearance. — _Atlassian Design System_
- Thin wrapper with controlled+uncontrolled value and render-prop slot — _Base UI_
- Stateful + Stateless; start/end enhancer slots; MaskedInput sibling — _BaseWeb (Uber)_
- Variants include PasswordInput, ControlledPasswordInput; counter prop. — _Carbon (IBM)_
- Single styled input; InputGroup for icon prefixes — _Catalyst (Tailwind Labs)_
- Variants outline/subtle/flushed — _Chakra UI_
- Slots for contentBefore/contentAfter (icons, buttons) around native input — _Fluent UI React (v9 / Fluent 2)_
- Thin wrapper exposing data-hover/focus/disabled/invalid for styling — _Headless UI (React)_
- Headless React Aria primitive (sibling of Input) — _HeroUI_
- Composite over InputBase + InputLabel + FormHelperText; variants filled/outlined/standard — _MUI (Material UI)_
- Most-used input wrapper — _Mantine_
- classless type-aware styling for text/email/number/tel/url/password — _Pico.css_
- Controlled; rich affix slots (prefix/suffix/connectedLeft). — _Polaris (Shopify)_
- Visual slot props and inline action. — _Primer (GitHub)_
- Part-based (TextField/Label/Input/Description/FieldError); validation function + native + RAC validation — _React Aria Components_
- Form-aware text input with label/description/error slot — _React Spectrum (Adobe)_
- classless input with focus ring and file::file-selector-button styling — _Sakura.css_
- classless type-aware styling (text/email/radio/checkbox) — _Simple.css_
- classless type-aware styling — _Water.css_
- covers text/password/date/email/number/search/tel/time/month/week/url with shared styling — _awsm.css_
- Class on native \<input\>: input + input-{color|ghost} + input-{xs..xl}; container variant with icon slots — _daisyUI_
- Styled native \<input\> — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/input) — `Input`
- [Atlassian Design System](https://atlassian.design/components/textfield/examples) — `Text field`
- [Base UI](https://base-ui.com/react/components/input) — `Input`
- [BaseWeb (Uber)](https://baseweb.design/components/input/) — `Input`
- [Carbon (IBM)](https://carbondesignsystem.com/components/text-input/usage/) — `TextInput`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/input) — `Input`
- [Chakra UI](https://chakra-ui.com/docs/components/input) — `Input`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-input--docs) — `Input`
- [Headless UI (React)](https://headlessui.com/react/input) — `Input`
- [HeroUI](https://heroui.com/en/docs/react/components/text-field) — `Text Field`
- [MUI (Material UI)](https://mui.com/material-ui/react-text-field/) — `Text Field`
- [MVP.css](https://andybrewer.github.io/mvp/) — `Input`
- [Mantine](https://mantine.dev/core/text-input/) — `TextInput`
- [Pico.css](https://picocss.com/docs/forms/input) — `Input`
- [Polaris (Shopify)](https://polaris.shopify.com/components/selection-and-input/text-field) — `Text field`
- [Primer (GitHub)](https://primer.style/components/text-input) — `TextInput`
- [React Aria Components](https://react-aria.adobe.com/TextField) — `TextField`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/TextField.html) — `TextField`
- [Sakura.css](https://github.com/oxalorg/sakura/blob/master/css/sakura.css) — `Input`
- [Simple.css](https://simplecss.org/demo) — `Input`
- [Water.css](https://watercss.kognise.dev/) — `Input`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Input (text family)`
- [daisyUI](https://daisyui.com/components/input/) — `Text Input`
- [new.css](https://newcss.net/demo/) — `Input`
- [shadcn/ui](https://ui.shadcn.com/docs/components/input) — `Input`

---

### DropdownMenu

**Systems including:** 24  |  **Lens:** app  |  **Teseor:** missing

**Category:** composite (all 24 systems)

**Aliases observed:** `ActionMenu`, `Dropdown`, `Dropdown Menu`, `Dropdown menu`, `Dropdowns`, `Menu`, `MenuButton`, `dropdown`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `open` | 9 (Ark UI, Base UI, Chakra UI, Fluent UI React (v9 / Fluent 2) +5 more) |
| `onOpenChange` | 8 (Ark UI, Base UI, Chakra UI, Fluent UI React (v9 / Fluent 2) +4 more) |
| `defaultOpen` | 4 (Ark UI, Base UI, Radix UI Primitives, shadcn/ui) |
| `items` | 4 (Ant Design, BaseWeb (Uber), React Aria Components, React Spectrum (Adobe)) |
| `modal` | 4 (Base UI, Headless UI (React), Radix UI Primitives, shadcn/ui) |
| `positioning` | 3 (Ark UI, Chakra UI, Fluent UI React (v9 / Fluent 2)) |
| `selectedKeys` | 3 (Ant Design, React Aria Components, React Spectrum (Adobe)) |
| `anchor` | 2 (Catalyst (Tailwind Labs), Headless UI (React)) |
| `closeOnSelect` | 2 (Ark UI, HeroUI) |
| `disabledKeys` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `onAction` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `openOnHover` | 2 (Base UI, Fluent UI React (v9 / Fluent 2)) |
| `selectionMode` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `size` | 2 (BaseWeb (Uber), Carbon (IBM)) |
| `anchorEl` | 1 (MUI (Material UI)) |
| `anchorOrigin` | 1 (MUI (Material UI)) |
| `anchorRef` | 1 (Primer (GitHub)) |
| `as` | 1 (Headless UI (React)) |
| `asChild` | 1 (Radix UI Primitives) |
| `backdrop` | 1 (HeroUI) |
| `checkedValues` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `children` | 1 (Atlassian Design System) |
| `className` | 1 (Catalyst (Tailwind Labs)) |
| `closeOnItemClick` | 1 (Mantine) |
| `delay` | 1 (Base UI) |
| `dir` | 1 (Radix UI Primitives) |
| `disabled` | 1 (Headless UI (React)) |
| `inlineCollapsed` | 1 (Ant Design) |
| `isOpen` | 1 (HeroUI) |
| `kind` | 1 (Carbon (IBM)) |
| `label` | 1 (Carbon (IBM)) |
| `load-on-scroll` | 1 (FormKit) |
| `loopFocus` | 1 (Chakra UI) |
| `menuAlignment` | 1 (Carbon (IBM)) |
| `MenuListProps` | 1 (MUI (Material UI)) |
| `mode` | 1 (Ant Design) |
| `name` | 1 (FormKit) |
| `onChange` | 1 (Mantine) |
| `onCheckedValueChange` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `onClose` | 1 (MUI (Material UI)) |
| _… +23 more props_ | |

**A11y / ARIA observations:**

- role=menu/menuitem; arrow-key navigation; submenu support — _Ant Design, Mantine_
- WAI-ARIA Menu Button with roving tabindex, typeahead, nested submenus — _Ark UI, Base UI_
- ARIA menu/menuitem/menuitemcheckbox/menuitemradio. — _Atlassian Design System_
- role=menu/menuitem; aria-activedescendant navigation — _BaseWeb (Uber)_
- aria-haspopup/expanded on trigger; role=menu on .dropdown-menu — _Bootstrap_
- Disclosure menu trigger. — _Carbon (IBM)_
- Wraps Headless UI Menu; full keyboard support — _Catalyst (Tailwind Labs)_
- role=menu/menuitem; keyboard navigation; typeahead — _Chakra UI_
- role=menu/menuitem/menuitemcheckbox/menuitemradio; submenus aria-haspopup — _Fluent UI React (v9 / Fluent 2)_
- ARIA listbox/combobox pattern, keyboard nav — _FormKit_
- WAI-ARIA Menu Button pattern with Enter/Space open, arrow nav, typeahead, Esc close — _Headless UI (React)_
- React Aria MenuTrigger + Menu: role=menu/menuitem — _HeroUI_
- role=menu; arrow-key navigation; aria-haspopup on trigger — _MUI (Material UI)_
- uses details/summary disclosure semantics — _Pico.css_
- Combines disclosure pattern with menu listbox. — _Primer (GitHub)_
- WAI-ARIA Menu Button pattern with roving tabindex, typeahead, arrow nav — _Radix UI Primitives_
- WAI-ARIA Menu Button with arrow nav, typeahead, sub-menus — _React Aria Components_
- Native select semantics — _React Day Picker_
- role=menu/menuitem; sections labelled; arrow-key nav — _React Spectrum (Adobe)_
- Headless UI Menu a11y — _Tailwind Plus UI Blocks_
- Native list/button semantics — _daisyUI_
- Radix primitive: role="menu", keyboard nav, type-ahead — _shadcn/ui_

**Design choices observed:**

- horizontal/vertical/inline modes; items-prop API — _Ant Design_
- Part-based (Root/Trigger/Indicator/Positioner/Content/Item/ItemGroup/ItemGroupLabel/Separator/CheckboxItem/RadioItemGroup/RadioItem/ItemIndicator/ItemText/ContextTrigger/TriggerItem) — _Ark UI_
- Compositional building blocks for menus (LinkItem/ButtonItem/Section etc.). — _Atlassian Design System_
- Part-based (Root/Trigger/Portal/Backdrop/Positioner/Popup/Arrow/Item/CheckboxItem/RadioGroup/RadioItem/ItemIndicator/Group/GroupLabel/Separator/SubmenuRoot/SubmenuTrigger) — _Base UI_
- Stateful + Stateless; supports nested submenus, child menu, grouped menu — _BaseWeb (Uber)_
- .dropdown + .dropdown-toggle + .dropdown-menu + .dropdown-item; Popper-based positioning — _Bootstrap_
- Button that opens a Menu. — _Carbon (IBM)_
- Dropdown + DropdownButton + DropdownMenu + DropdownItem + DropdownSection + DropdownHeading + DropdownLabel + DropdownDescription + DropdownDivider — _Catalyst (Tailwind Labs)_
- Composite Menu.\* parts, submenu support — _Chakra UI_
- Menu + MenuTrigger + MenuPopover + MenuList + MenuItem\* slots; checkbox/radio item variants — _Fluent UI React (v9 / Fluent 2)_
- Pro input; styled select replacement with async options support — _FormKit_
- Part-based (Menu/MenuButton/MenuItems/MenuItem/MenuSection/MenuHeading/MenuSeparator); render-prop state; \`as\` polymorphism; Floating UI anchor positioning — _Headless UI (React)_
- Composite Dropdown + DropdownTrigger + DropdownMenu + DropdownItem/Section — _HeroUI_
- Popover-based; controlled open via anchorEl — _MUI (Material UI)_
- Composite Menu.Target + Dropdown + Item + Label + Sub — _Mantine_
- details/summary with ul of links; CSS-only no JS required — _Pico.css_
- ActionList rendered inside Overlay via .Anchor/.Overlay parts. — _Primer (GitHub)_
- Part-based with CheckboxItem/RadioGroup/RadioItem/Sub\*/ItemIndicator/Label/Separator; portal rendering — _Radix UI Primitives_
- Part-based (MenuTrigger/Popover/Menu/MenuItem/MenuSection/Header/Separator/SubmenuTrigger); collection items — _React Aria Components_
- Shared dropdown slot used for month + year — _React Day Picker_
- Collection of Item/Section paired with MenuTrigger — _React Spectrum (Adobe)_
- 5 dropdown-menu variants on Headless UI Menu — _Tailwind Plus UI Blocks_
- menu + menu-{xs..xl} + menu-{horizontal|vertical} + menu-title; nested ul for submenus — _daisyUI_
- Radix-based; Trigger/Content/Item/CheckboxItem/RadioGroup/Sub parts — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/menu) — `Menu`
- [Ark UI](https://ark-ui.com/docs/components/menu) — `Menu`
- [Atlassian Design System](https://atlassian.design/components/menu/examples) — `Menu`
- [Base UI](https://base-ui.com/react/components/menu) — `Menu`
- [BaseWeb (Uber)](https://baseweb.design/components/menu/) — `Menu`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/dropdowns/) — `Dropdowns`
- [Carbon (IBM)](https://github.com/carbon-design-system/carbon/tree/main/packages/react/src/components/MenuButton) — `MenuButton`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/dropdown) — `Dropdown`
- [Chakra UI](https://chakra-ui.com/docs/components/menu) — `Menu`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-menu-menu--docs) — `Menu`
- [FormKit](https://formkit.com/inputs/dropdown) — `dropdown`
- [Headless UI (React)](https://headlessui.com/react/menu) — `Menu`
- [HeroUI](https://heroui.com/en/docs/react/components/dropdown) — `Dropdown`
- [MUI (Material UI)](https://mui.com/material-ui/react-menu/) — `Menu`
- [Mantine](https://mantine.dev/core/menu/) — `Menu`
- [Pico.css](https://picocss.com/docs/dropdown) — `Dropdown`
- [Primer (GitHub)](https://primer.style/components/action-menu) — `ActionMenu`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/dropdown-menu) — `Dropdown Menu`
- [React Aria Components](https://react-aria.adobe.com/Menu) — `Menu`
- [React Day Picker](https://daypicker.dev/guides/custom-components) — `Dropdown`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Menu.html) — `Menu`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/elements/dropdowns) — `Dropdowns`
- [daisyUI](https://daisyui.com/components/menu/) — `Menu`
- [shadcn/ui](https://ui.shadcn.com/docs/components/dropdown-menu) — `Dropdown Menu`

---

### RadioGroup

**Systems including:** 23  |  **Lens:** app  |  **Teseor:** missing

**Category mix:** composite×14, primitive×9

**Aliases observed:** `Radio`, `Radio / RadioGroup`, `Radio Group`, `Radio Groups`, `Radio button`, `RadioButtonGroup`, `RadioGroup`, `radio`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `value` | 18 (Ant Design, Ark UI, Atlassian Design System, Base UI +14 more) |
| `name` | 14 (Ark UI, Atlassian Design System, Base UI, BaseWeb (Uber) +10 more) |
| `disabled` | 11 (Ant Design, Ark UI, Base UI, BaseWeb (Uber) +7 more) |
| `onChange` | 10 (Ant Design, BaseWeb (Uber), Fluent UI React (v9 / Fluent 2), Headless UI (React) +6 more) |
| `defaultValue` | 8 (Ark UI, Base UI, Fluent UI React (v9 / Fluent 2), Headless UI (React) +4 more) |
| `orientation` | 7 (Ark UI, Base UI, Carbon (IBM), HeroUI +3 more) |
| `checked` | 5 (Ant Design, Chakra UI, Mantine, Pico.css, Polaris (Shopify)) |
| `label` | 5 (FormKit, HeroUI, Mantine, Polaris (Shopify), React Spectrum (Adobe)) |
| `onValueChange` | 5 (Ark UI, Base UI, HeroUI, Radix UI Primitives, shadcn/ui) |
| `required` | 4 (Base UI, Fluent UI React (v9 / Fluent 2), Primer (GitHub), Radix UI Primitives) |
| `isDisabled` | 3 (Atlassian Design System, React Aria Components, React Spectrum (Adobe)) |
| `color` | 2 (Catalyst (Tailwind Labs), HeroUI) |
| `align` | 1 (BaseWeb (Uber)) |
| `by` | 1 (Headless UI (React)) |
| `dir` | 1 (Radix UI Primitives) |
| `form` | 1 (Headless UI (React)) |
| `helpText` | 1 (Polaris (Shopify)) |
| `isChecked` | 1 (Atlassian Design System) |
| `isInvalid` | 1 (Atlassian Design System) |
| `isRequired` | 1 (React Aria Components) |
| `layout` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `legendText` | 1 (Carbon (IBM)) |
| `loop` | 1 (Radix UI Primitives) |
| `onCheckedChange` | 1 (Chakra UI) |
| `options` | 1 (FormKit) |
| `options-label` | 1 (FormKit) |
| `options-value` | 1 (FormKit) |
| `optionType` | 1 (Ant Design) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `row` | 1 (MUI (Material UI)) |
| `size` | 1 (HeroUI) |
| `validate` | 1 (React Spectrum (Adobe)) |
| `valueSelected` | 1 (Carbon (IBM)) |

**A11y / ARIA observations:**

- WAI-ARIA radiogroup with arrow nav and roving tabindex — _Ark UI, Base UI, Headless UI (React), React Aria Components_
- role=radiogroup with native radios and labels — _BaseWeb (Uber), Fluent UI React (v9 / Fluent 2)_
- Native radio inside Radio.Group — _Ant Design_
- Native radio semantics. — _Atlassian Design System_
- Fieldset + legend; radiogroup semantics. — _Carbon (IBM)_
- Wraps Headless UI RadioGroup — _Catalyst (Tailwind Labs)_
- Native radio inside RadioGroup — _Chakra UI_
- Group exposes role=radiogroup with associated legend — _FormKit_
- React Aria RadioGroup: role=radiogroup; arrow-key nav — _HeroUI_
- role=radiogroup; arrow-key navigation between Radio children — _MUI (Material UI)_
- Native radio; Radio.Group sets role=radiogroup — _Mantine_
- native radio semantics with shared name grouping — _Pico.css_
- Standard radio semantics; describedby for hint. — _Polaris (Shopify)_
- Fieldset + legend. — _Primer (GitHub)_
- WAI-ARIA Radio Group pattern with roving tabindex and arrow nav — _Radix UI Primitives_
- role=radiogroup with shared name; arrow-key navigation — _React Spectrum (Adobe)_
- Headless UI RadioGroup a11y for rich variants — _Tailwind Plus UI Blocks_
- Native radio semantics — _daisyUI_
- Radix primitive: role="radiogroup", arrow key nav — _shadcn/ui_

**Design choices observed:**

- Composite Radio + Radio.Group + Radio.Button — _Ant Design_
- Part-based (Root/Label/Item/ItemText/ItemControl/ItemHiddenInput/Indicator) — _Ark UI_
- Pairs with RadioGroup. — _Atlassian Design System_
- Part-based (Root/Indicator/HiddenInput) composed within RadioGroup — _Base UI_
- Stateful + Stateless; horizontal/vertical alignment — _BaseWeb (Uber)_
- Required to group RadioButton. — _Carbon (IBM)_
- RadioGroup + Radio + RadioField for grouped form composition — _Catalyst (Tailwind Labs)_
- Composite RadioGroup.Root + Item + ItemControl + ItemText — _Chakra UI_
- RadioGroup + Radio slot composition with horizontal/vertical/horizontalStacked layout — _Fluent UI React (v9 / Fluent 2)_
- Group of native radios from options array — _FormKit_
- Part-based (RadioGroup/Radio/Field/Label/Description); render-prop checked/active state — _Headless UI (React)_
- Composite RadioGroup + Radio — _HeroUI_
- Composite with FormControl/FormLabel/Radio children — _MUI (Material UI)_
- Composite Radio + Radio.Group + Radio.Card + Radio.Indicator — _Mantine_
- label-wrapped pattern, classless — _Pico.css_
- Controlled; pairs with ChoiceList for groups. — _Polaris (Shopify)_
- Compound .Label/.Caption/.Validation. — _Primer (GitHub)_
- Part-based (Root/Item/Indicator); hidden native input for forms — _Radix UI Primitives_
- Part-based (RadioGroup/Radio/Label/Description/FieldError); render-prop validation state — _React Aria Components_
- Form-aware group; supports validation slot — _React Spectrum (Adobe)_
- 12 radio-group variants (plain + card-style via Headless UI) — _Tailwind Plus UI Blocks_
- Class on native \<input type=radio\>: radio + radio-{color} + radio-{xs..xl} — _daisyUI_
- Radix-based; Root + Item parts — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/radio) — `Radio`
- [Ark UI](https://ark-ui.com/docs/components/radio-group) — `Radio Group`
- [Atlassian Design System](https://atlassian.design/components/radio/examples) — `Radio`
- [Base UI](https://base-ui.com/react/components/radio) — `Radio`
- [BaseWeb (Uber)](https://baseweb.design/components/radio/) — `RadioGroup`
- [Carbon (IBM)](https://github.com/carbon-design-system/carbon/tree/main/packages/react/src/components/RadioButtonGroup) — `RadioButtonGroup`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/radio) — `Radio button`
- [Chakra UI](https://chakra-ui.com/docs/components/radio) — `Radio`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-radiogroup--docs) — `Radio / RadioGroup`
- [FormKit](https://formkit.com/inputs/radio) — `radio`
- [Headless UI (React)](https://headlessui.com/react/radio-group) — `Radio Group`
- [HeroUI](https://heroui.com/en/docs/react/components/radio-group) — `Radio Group`
- [MUI (Material UI)](https://mui.com/material-ui/react-radio-button/) — `Radio Group`
- [Mantine](https://mantine.dev/core/radio/) — `Radio`
- [Pico.css](https://picocss.com/docs/forms/checkboxes-radios-switches) — `Radio`
- [Polaris (Shopify)](https://polaris.shopify.com/components/selection-and-input/radio-button) — `Radio button`
- [Primer (GitHub)](https://primer.style/components/radio-group) — `RadioGroup`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/radio-group) — `Radio Group`
- [React Aria Components](https://react-aria.adobe.com/RadioGroup) — `RadioGroup`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/RadioGroup.html) — `RadioGroup`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/forms/radio-groups) — `Radio Groups`
- [daisyUI](https://daisyui.com/components/radio/) — `Radio`
- [shadcn/ui](https://ui.shadcn.com/docs/components/radio-group) — `Radio Group`

---

### Textarea

**Systems including:** 22  |  **Lens:** app  |  **Teseor:** missing

**Category:** primitive (all 22 systems)

**Aliases observed:** `Text Area`, `Text area`, `TextArea`, `Textarea`, `Textareas`, `textarea`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `rows` | 8 (Carbon (IBM), Catalyst (Tailwind Labs), FormKit, Pico.css +4 more) |
| `value` | 6 (BaseWeb (Uber), Carbon (IBM), Fluent UI React (v9 / Fluent 2), HeroUI, Mantine, React Spectrum (Adobe)) |
| `disabled` | 5 (Catalyst (Tailwind Labs), Headless UI (React), Pico.css, Water.css, shadcn/ui) |
| `onChange` | 5 (BaseWeb (Uber), Fluent UI React (v9 / Fluent 2), HeroUI, Mantine, React Spectrum (Adobe)) |
| `resize` | 4 (Atlassian Design System, BaseWeb (Uber), Fluent UI React (v9 / Fluent 2), Primer (GitHub)) |
| `invalid` | 3 (Carbon (IBM), Catalyst (Tailwind Labs), Headless UI (React)) |
| `size` | 3 (BaseWeb (Uber), Chakra UI, Fluent UI React (v9 / Fluent 2)) |
| `aria-invalid` | 2 (Pico.css, shadcn/ui) |
| `cols` | 2 (FormKit, Primer (GitHub)) |
| `label` | 2 (FormKit, React Spectrum (Adobe)) |
| `maxRows` | 2 (HeroUI, Mantine) |
| `minRows` | 2 (HeroUI, Mantine) |
| `name` | 2 (FormKit, Pico.css) |
| `placeholder` | 2 (Chakra UI, FormKit) |
| `resizable` | 2 (Catalyst (Tailwind Labs), Headless UI (React)) |
| `variant` | 2 (Chakra UI, HeroUI) |
| `appearance` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `as` | 1 (Headless UI (React)) |
| `autoresize` | 1 (Chakra UI) |
| `autosize` | 1 (Mantine) |
| `defaultValue` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `enableCounter` | 1 (Carbon (IBM)) |
| `error` | 1 (BaseWeb (Uber)) |
| `isClearable` | 1 (HeroUI) |
| `isDisabled` | 1 (React Spectrum (Adobe)) |
| `isInvalid` | 1 (Atlassian Design System) |
| `isRequired` | 1 (React Spectrum (Adobe)) |
| `labelPlacement` | 1 (HeroUI) |
| `labelText` | 1 (Carbon (IBM)) |
| `maxCount` | 1 (Carbon (IBM)) |
| `maxHeight` | 1 (Atlassian Design System) |
| `minimumRows` | 1 (Atlassian Design System) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `validate` | 1 (React Spectrum (Adobe)) |
| `validation` | 1 (FormKit) |
| `validationStatus` | 1 (Primer (GitHub)) |

**A11y / ARIA observations:**

- Pairs with Form Field. — _Atlassian Design System_
- Native textarea; aria-invalid on error — _BaseWeb (Uber)_
- aria-describedby ties helper/error. — _Carbon (IBM)_
- aria-invalid wired via Field — _Catalyst (Tailwind Labs)_
- Native textarea — _Chakra UI_
- Native textarea; aria-describedby via Field — _Fluent UI React (v9 / Fluent 2)_
- Native \<textarea\> with label association — _FormKit_
- Wraps native textarea; aria-invalid wiring via Field context — _Headless UI (React)_
- React Aria TextArea; label/description/error wired — _HeroUI_
- Native textarea with aria-invalid — _Mantine_
- aria-invalid drives validation styling — _Pico.css_
- Pairs with FormControl. — _Primer (GitHub)_
- Native textarea with aria-describedby errors — _React Spectrum (Adobe)_
- Native textarea semantics — _daisyUI_
- aria-invalid for error styling — _shadcn/ui_

**Design choices observed:**

- classless multiline input — _MVP.css, Simple.css, new.css_
- Auto-grow up to maxHeight. — _Atlassian Design System_
- Stateful + Stateless wrapper of native textarea — _BaseWeb (Uber)_
- Optional character counter. — _Carbon (IBM)_
- Styled native textarea — _Catalyst (Tailwind Labs)_
- Variants + optional auto-resize — _Chakra UI_
- Slot-based root/textarea with token-driven appearance — _Fluent UI React (v9 / Fluent 2)_
- Plain native textarea — _FormKit_
- Thin wrapper; data-\* attributes for styling states — _Headless UI (React)_
- Auto-resize between minRows and maxRows — _HeroUI_
- Auto-resize via react-textarea-autosize — _Mantine_
- tag-based, matches input visual treatment — _Pico.css_
- Token-styled native textarea. — _Primer (GitHub)_
- TextField sibling for multi-line input — _React Spectrum (Adobe)_
- classless multiline input with focus ring — _Sakura.css_
- 5 textarea-input variants — _Tailwind Plus UI Blocks_
- tag-styled multiline input — _Water.css_
- classless multiline input with focus state and placeholder styling — _awsm.css_
- Class on native \<textarea\>: textarea + textarea-{color|ghost} + textarea-{xs..xl} — _daisyUI_
- Styled native \<textarea\> — _shadcn/ui_

**Source URLs:**

- [Atlassian Design System](https://atlassian.design/components/textarea/examples) — `Text area`
- [BaseWeb (Uber)](https://baseweb.design/components/textarea/) — `Textarea`
- [Carbon (IBM)](https://carbondesignsystem.com/components/text-input/usage/) — `TextArea`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/textarea) — `Textarea`
- [Chakra UI](https://chakra-ui.com/docs/components/textarea) — `Textarea`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-textarea--docs) — `Textarea`
- [FormKit](https://formkit.com/inputs/textarea) — `textarea`
- [Headless UI (React)](https://headlessui.com/react/textarea) — `Textarea`
- [HeroUI](https://heroui.com/en/docs/react/components/text-area) — `Text Area`
- [MVP.css](https://andybrewer.github.io/mvp/) — `Textarea`
- [Mantine](https://mantine.dev/core/textarea/) — `Textarea`
- [Pico.css](https://picocss.com/docs/forms/textarea) — `Textarea`
- [Primer (GitHub)](https://primer.style/components/textarea) — `Textarea`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/TextArea.html) — `TextArea`
- [Sakura.css](https://github.com/oxalorg/sakura/blob/master/css/sakura.css) — `Textarea`
- [Simple.css](https://simplecss.org/demo) — `Textarea`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/forms/textareas) — `Textareas`
- [Water.css](https://watercss.kognise.dev/) — `Textarea`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Textarea`
- [daisyUI](https://daisyui.com/components/textarea/) — `Textarea`
- [new.css](https://newcss.net/demo/) — `Textarea`
- [shadcn/ui](https://ui.shadcn.com/docs/components/textarea) — `Textarea`

---

### Switch

**Systems including:** 21  |  **Lens:** app  |  **Teseor:** missing

**Category mix:** primitive×20, composite×1

**Aliases observed:** `Switch`, `Toggle`, `Toggle Tip`, `Toggles`, `toggle`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `onChange` | 9 (Ant Design, Atlassian Design System, BaseWeb (Uber), Fluent UI React (v9 / Fluent 2) +5 more) |
| `checked` | 8 (Ant Design, BaseWeb (Uber), Catalyst (Tailwind Labs), Fluent UI React (v9 / Fluent 2) +4 more) |
| `size` | 8 (Ant Design, Atlassian Design System, Carbon (IBM), Fluent UI React (v9 / Fluent 2) +4 more) |
| `disabled` | 7 (Ark UI, Base UI, BaseWeb (Uber), Catalyst (Tailwind Labs) +3 more) |
| `name` | 4 (Catalyst (Tailwind Labs), FormKit, Headless UI (React), React Aria Components) |
| `onPressedChange` | 4 (Ark UI, Base UI, Radix UI Primitives, shadcn/ui) |
| `pressed` | 4 (Ark UI, Base UI, Radix UI Primitives, shadcn/ui) |
| `color` | 3 (Catalyst (Tailwind Labs), HeroUI, MUI (Material UI)) |
| `defaultChecked` | 3 (Catalyst (Tailwind Labs), Fluent UI React (v9 / Fluent 2), Headless UI (React)) |
| `defaultPressed` | 3 (Ark UI, Base UI, Radix UI Primitives) |
| `isDisabled` | 3 (Atlassian Design System, React Aria Components, React Spectrum (Adobe)) |
| `isSelected` | 3 (HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `defaultSelected` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `value` | 2 (Headless UI (React), React Aria Components) |
| `as` | 1 (Headless UI (React)) |
| `asChild` | 1 (Radix UI Primitives) |
| `checkedChildren` | 1 (Ant Design) |
| `disabledFocusable` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `endContent` | 1 (HeroUI) |
| `form` | 1 (Headless UI (React)) |
| `hideLabel` | 1 (Carbon (IBM)) |
| `isChecked` | 1 (Atlassian Design System) |
| `isReadOnly` | 1 (React Spectrum (Adobe)) |
| `label` | 1 (FormKit) |
| `labelA` | 1 (Carbon (IBM)) |
| `labelB` | 1 (Carbon (IBM)) |
| `labelPlacement` | 1 (BaseWeb (Uber)) |
| `labelPosition` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `loading` | 1 (Ant Design) |
| `off-value` | 1 (FormKit) |
| `offLabel` | 1 (Mantine) |
| `on-value` | 1 (FormKit) |
| `onLabel` | 1 (Mantine) |
| `onOpenChange` | 1 (Chakra UI) |
| `onValueChange` | 1 (HeroUI) |
| `open` | 1 (Chakra UI) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `positioning` | 1 (Chakra UI) |
| `role=switch` | 1 (Pico.css) |
| `startContent` | 1 (HeroUI) |
| _… +7 more props_ | |

**A11y / ARIA observations:**

- role=switch with aria-checked — _BaseWeb (Uber), Fluent UI React (v9 / Fluent 2), FormKit, React Spectrum (Adobe)_
- Button with aria-pressed — _Ark UI, Base UI_
- role=switch with aria-checked. — _Atlassian Design System, Carbon (IBM)_
- role=switch — _Ant Design_
- Wraps Headless UI Switch: role="switch" — _Catalyst (Tailwind Labs)_
- Click-triggered tip with role=tooltip semantics — _Chakra UI_
- WAI-ARIA switch role with Space toggle — _Headless UI (React)_
- React Aria Switch: role=switch — _HeroUI_
- role=switch via native input\[type=checkbox\] — _MUI (Material UI)_
- role=switch via native input — _Mantine_
- role=switch promotes checkbox to switch semantics — _Pico.css_
- Button with aria-pressed reflecting on/off state — _Radix UI Primitives_
- WAI-ARIA switch role; Space toggle — _React Aria Components_
- role="switch" via Headless UI Switch — _Tailwind Plus UI Blocks_
- Native checkbox semantics with role=switch convention — _daisyUI_
- Radix primitive: role="button", aria-pressed — _shadcn/ui_

**Design choices observed:**

- Built-in loading state — _Ant Design_
- Part-based (Root/Indicator) — _Ark UI_
- Controlled/uncontrolled with size token. — _Atlassian Design System_
- Single-element primitive; render-prop slot — _Base UI_
- Toggle styled checkbox with label — _BaseWeb (Uber)_
- Bi-state with on/off labels. — _Carbon (IBM)_
- SwitchGroup + SwitchField for form composition — _Catalyst (Tailwind Labs)_
- Click-triggered tooltip variant — _Chakra UI_
- Slot-based root/indicator/input/label — _Fluent UI React (v9 / Fluent 2)_
- Pro input; on/off-value override boolean — _FormKit_
- Single-element with Field/Label/Description companions; render-prop state — _Headless UI (React)_
- Tailwind variants; thumb/start/end content slots — _HeroUI_
- Themed toggle; FormControlLabel pairing — _MUI (Material UI)_
- Composite Switch + Switch.Group — _Mantine_
- attribute-based switch via role=switch on input\[type=checkbox\] — _Pico.css_
- Single-part; asChild slot — _Radix UI Primitives_
- Render-prop state; data-selected attr — _React Aria Components_
- Always single-element; uses VisuallyHidden input — _React Spectrum (Adobe)_
- 5 toggle-switch variants on Headless UI Switch — _Tailwind Plus UI Blocks_
- Class on native \<input type=checkbox\>: toggle + toggle-{color} + toggle-{xs..xl} — _daisyUI_
- Radix-based with CVA variants — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/switch) — `Switch`
- [Ark UI](https://ark-ui.com/docs/components/toggle) — `Toggle`
- [Atlassian Design System](https://atlassian.design/components/toggle/examples) — `Toggle`
- [Base UI](https://base-ui.com/react/components/toggle) — `Toggle`
- [BaseWeb (Uber)](https://baseweb.design/components/switch/) — `Switch`
- [Carbon (IBM)](https://carbondesignsystem.com/components/toggle/usage/) — `Toggle`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/switch) — `Switch`
- [Chakra UI](https://chakra-ui.com/docs/components/toggle-tip) — `Toggle Tip`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-switch--docs) — `Switch`
- [FormKit](https://formkit.com/inputs/toggle) — `toggle`
- [Headless UI (React)](https://headlessui.com/react/switch) — `Switch`
- [HeroUI](https://heroui.com/en/docs/react/components/switch) — `Switch`
- [MUI (Material UI)](https://mui.com/material-ui/react-switch/) — `Switch`
- [Mantine](https://mantine.dev/core/switch/) — `Switch`
- [Pico.css](https://picocss.com/docs/forms/checkboxes-radios-switches) — `Switch`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/toggle) — `Toggle`
- [React Aria Components](https://react-aria.adobe.com/Switch) — `Switch`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Switch.html) — `Switch`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/forms/toggles) — `Toggles`
- [daisyUI](https://daisyui.com/components/toggle/) — `Toggle`
- [shadcn/ui](https://ui.shadcn.com/docs/components/toggle) — `Toggle`

---

### Slider

**Systems including:** 20  |  **Lens:** app  |  **Teseor:** missing

**Category mix:** primitive×15, composite×5

**Aliases observed:** `Range`, `Range slider`, `RangeSlider`, `Slider`, `range`, `slider`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `step` | 18 (Ant Design, Ark UI, Atlassian Design System, Base UI +14 more) |
| `value` | 17 (Ant Design, Ark UI, Atlassian Design System, Base UI +13 more) |
| `max` | 15 (Ant Design, Ark UI, Atlassian Design System, Base UI +11 more) |
| `min` | 15 (Ant Design, Ark UI, Atlassian Design System, Base UI +11 more) |
| `onChange` | 10 (Ant Design, Atlassian Design System, BaseWeb (Uber), Fluent UI React (v9 / Fluent 2) +6 more) |
| `orientation` | 7 (Ark UI, Base UI, Chakra UI, HeroUI +3 more) |
| `defaultValue` | 6 (Ark UI, Base UI, Fluent UI React (v9 / Fluent 2), Radix UI Primitives, React Aria Components, shadcn/ui) |
| `marks` | 5 (Ant Design, BaseWeb (Uber), FormKit, MUI (Material UI), Mantine) |
| `onValueChange` | 5 (Ark UI, Base UI, Chakra UI, Radix UI Primitives, shadcn/ui) |
| `disabled` | 3 (Ark UI, Base UI, Radix UI Primitives) |
| `maxValue` | 3 (HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `minValue` | 3 (HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `vertical` | 2 (Ant Design, Fluent UI React (v9 / Fluent 2)) |
| `fillOffset` | 1 (React Spectrum (Adobe)) |
| `formatOptions` | 1 (React Spectrum (Adobe)) |
| `hideTextInput` | 1 (Carbon (IBM)) |
| `inverted` | 1 (Radix UI Primitives) |
| `label` | 1 (Mantine) |
| `labelText` | 1 (Carbon (IBM)) |
| `name` | 1 (FormKit) |
| `onChangeEnd` | 1 (React Aria Components) |
| `onValueCommit` | 1 (Radix UI Primitives) |
| `onValueCommitted` | 1 (Base UI) |
| `output` | 1 (Polaris (Shopify)) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `range` | 1 (Ant Design) |
| `showSteps` | 1 (HeroUI) |
| `showTooltip` | 1 (HeroUI) |
| `size` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `tooltip` | 1 (FormKit) |
| `track` | 1 (MUI (Material UI)) |
| `value-format` | 1 (FormKit) |

**A11y / ARIA observations:**

- role=slider; aria-valuemin/max/now — _Ant Design, Mantine_
- WAI-ARIA Slider with arrow/Home/End/PgUp/PgDn — _Ark UI, Base UI_
- role=slider with aria-valuemin/max/now — _Chakra UI, FormKit_
- aria-valuemin/max/now. — _Atlassian Design System_
- Native input\[type=range\] with aria-valuetext — _BaseWeb (Uber)_
- Native range slider semantics — _Bootstrap_
- aria-valuemin/max/now; paired number input. — _Carbon (IBM)_
- Native input\[type=range\] inside thumb slot; aria-valuenow — _Fluent UI React (v9 / Fluent 2)_
- React Aria Slider: role=slider; aria-valuetext for steps — _HeroUI_
- role=slider; aria-valuemin/max/now; arrow-key adjustments — _MUI (Material UI)_
- native slider semantics — _Pico.css_
- aria-valuemin/max/now; dual-thumb supported. — _Polaris (Shopify)_
- WAI-ARIA Slider pattern with arrow/Home/End/PageUp/Down keys — _Radix UI Primitives_
- WAI-ARIA Slider with arrow/Home/End/PgUp/PgDn keys; localized value formatting — _React Aria Components_
- role=slider with aria-valuetext — _React Spectrum (Adobe)_
- Native range input semantics — _daisyUI_
- Radix primitive: role="slider", aria-valuenow, arrow key nav — _shadcn/ui_

**Design choices observed:**

- Optional range (two thumbs) — _Ant Design_
- Part-based (Root/Label/Control/Thumb/HiddenInput/Track/Range/ValueText/MarkerGroup/Marker); supports multi-thumb — _Ark UI_
- Single-handle slider with token styling. — _Atlassian Design System_
- Part-based (Root/Value/Control/Track/Indicator/Thumb); supports multi-thumb via array value — _Base UI_
- Stateful + Stateless; supports range (two thumbs) via array value — _BaseWeb (Uber)_
- .form-range styled native input\[type=range\] — _Bootstrap_
- Includes optional bound NumberInput; two-handle range variant. — _Carbon (IBM)_
- Composite Slider.\* parts, single/multi-thumb range — _Chakra UI_
- Slot-based rail/thumb/input; vertical orientation toggle — _Fluent UI React (v9 / Fluent 2)_
- Pro input; single or dual-handle slider — _FormKit_
- Single or multi-thumb; vertical orientation supported — _HeroUI_
- Single or range thumbs; discrete/continuous; marks — _MUI (Material UI)_
- Single thumb with tooltip label — _Mantine_
- classless styled native range — _Pico.css_
- Controlled; supports dual values for ranges. — _Polaris (Shopify)_
- Part-based (Root/Track/Range/Thumb); supports multi-thumb via array value — _Radix UI Primitives_
- Part-based (Slider/Label/Output/SliderTrack/SliderThumb); multi-thumb via array value — _React Aria Components_
- Single thumb; vertical orientation supported — _React Spectrum (Adobe)_
- Class on native \<input type=range\>: range + range-{color} + range-{xs..xl} — _daisyUI_
- Radix-based; supports range (multi-thumb) — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/slider) — `Slider`
- [Ark UI](https://ark-ui.com/docs/components/slider) — `Slider`
- [Atlassian Design System](https://atlassian.design/components/range/examples) — `Range`
- [Base UI](https://base-ui.com/react/components/slider) — `Slider`
- [BaseWeb (Uber)](https://baseweb.design/components/slider/) — `Slider`
- [Bootstrap](https://getbootstrap.com/docs/5.3/forms/range/) — `Range`
- [Carbon (IBM)](https://carbondesignsystem.com/components/slider/usage/) — `Slider`
- [Chakra UI](https://chakra-ui.com/docs/components/slider) — `Slider`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-slider--docs) — `Slider`
- [FormKit](https://formkit.com/inputs/slider) — `slider`
- [HeroUI](https://heroui.com/en/docs/react/components/slider) — `Slider`
- [MUI (Material UI)](https://mui.com/material-ui/react-slider/) — `Slider`
- [Mantine](https://mantine.dev/core/slider/) — `Slider`
- [Pico.css](https://picocss.com/docs/forms/range) — `Range`
- [Polaris (Shopify)](https://polaris.shopify.com/components/selection-and-input/range-slider) — `Range slider`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/slider) — `Slider`
- [React Aria Components](https://react-aria.adobe.com/Slider) — `Slider`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Slider.html) — `Slider`
- [daisyUI](https://daisyui.com/components/range/) — `Range slider`
- [shadcn/ui](https://ui.shadcn.com/docs/components/slider) — `Slider`

---

### Avatar

**Systems including:** 19  |  **Lens:** app  |  **Teseor:** missing

**Category mix:** primitive×16, composite×3

**Aliases observed:** `Avatar`, `Avatars (UI Blocks)`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `src` | 13 (Ant Design, Atlassian Design System, BaseWeb (Uber), Catalyst (Tailwind Labs) +9 more) |
| `size` | 10 (Ant Design, Atlassian Design System, BaseWeb (Uber), Chakra UI +6 more) |
| `alt` | 8 (Catalyst (Tailwind Labs), MUI (Material UI), Mantine, Primer (GitHub) +4 more) |
| `name` | 6 (Atlassian Design System, BaseWeb (Uber), Chakra UI, Fluent UI React (v9 / Fluent 2), HeroUI, Polaris (Shopify)) |
| `initials` | 4 (BaseWeb (Uber), Catalyst (Tailwind Labs), Fluent UI React (v9 / Fluent 2), Polaris (Shopify)) |
| `color` | 3 (Fluent UI React (v9 / Fluent 2), HeroUI, Mantine) |
| `shape` | 3 (Ant Design, Chakra UI, Fluent UI React (v9 / Fluent 2)) |
| `className` | 2 (Catalyst (Tailwind Labs), shadcn/ui) |
| `icon` | 2 (Ant Design, Fluent UI React (v9 / Fluent 2)) |
| `radius` | 2 (HeroUI, Mantine) |
| `square` | 2 (Catalyst (Tailwind Labs), Primer (GitHub)) |
| `active` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `appearance` | 1 (Atlassian Design System) |
| `asChild` | 1 (Radix UI Primitives) |
| `badge` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `children` | 1 (MUI (Material UI)) |
| `colorPalette` | 1 (Chakra UI) |
| `customer` | 1 (Polaris (Shopify)) |
| `delay` | 1 (Base UI) |
| `delayMs` | 1 (Radix UI Primitives) |
| `fallback` | 1 (HeroUI) |
| `gap` | 1 (Ant Design) |
| `image` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `isBordered` | 1 (HeroUI) |
| `isDisabled` | 1 (React Spectrum (Adobe)) |
| `onLoadingStatusChange` | 1 (Radix UI Primitives) |
| `onStatusChange` | 1 (Ark UI) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `presence` | 1 (Atlassian Design System) |
| `sizes` | 1 (MUI (Material UI)) |
| `source` | 1 (Polaris (Shopify)) |
| `status` | 1 (Atlassian Design System) |
| `variant` | 1 (MUI (Material UI)) |

**A11y / ARIA observations:**

- alt with src; fallback icon/text — _Ant Design_
- Image alt + fallback semantics — _Ark UI_
- name becomes accessible label; presence labelled. — _Atlassian Design System_
- Image alt with fallback semantics — _Base UI_
- Renders img with alt from name; fallback initials marked aria-hidden — _BaseWeb (Uber)_
- alt text required for image avatars — _Catalyst (Tailwind Labs)_
- alt computed from name; fallback initials/icon — _Chakra UI_
- img role with alt from name; presence badge labelled by activeAriaLabel — _Fluent UI React (v9 / Fluent 2)_
- alt fallback; falls back to initials — _HeroUI_
- alt on img; falls back to initials/icon — _MUI (Material UI)_
- alt fallback for image; initials fallback — _Mantine_
- Accessible name from \`name\`/\`accessibilityLabel\`. — _Polaris (Shopify)_
- Requires alt for meaningful avatars. — _Primer (GitHub)_
- Image with alt; falls back to Fallback child when load fails — _Radix UI Primitives_
- Image with alt or treated as decorative when no alt — _React Aria Components_
- img element with alt; decorative when alt empty — _React Spectrum (Adobe)_
- alt text on img variants — _Tailwind Plus UI Blocks_
- alt text required on img — _daisyUI_
- Radix primitive: img semantics with fallback — _shadcn/ui_

**Design choices observed:**

- Composite Avatar + Avatar.Group with max overflow — _Ant Design_
- Part-based (Root/Image/Fallback); status state-machine — _Ark UI_
- Circle vs square; presence/status badges. — _Atlassian Design System_
- Part-based (Root/Image/Fallback); load-status state machine — _Base UI_
- Single element with image fallback to initials — _BaseWeb (Uber)_
- Single component; initials fallback when no src; square vs circular — _Catalyst (Tailwind Labs)_
- Composite Avatar.Root + Image + Fallback; AvatarGroup — _Chakra UI_
- Slots for image/initials/icon/badge; auto-initials + color from id — _Fluent UI React (v9 / Fluent 2)_
- Composite Avatar + AvatarGroup with max overflow — _HeroUI_
- circular/rounded/square variants; AvatarGroup for stacking — _MUI (Material UI)_
- Composite Avatar + Avatar.Group; placeholder generation — _Mantine_
- Initials fallback when no image. — _Polaris (Shopify)_
- Square variant for orgs vs round for users. — _Primer (GitHub)_
- Part-based (Root/Image/Fallback); auto fallback on image error — _Radix UI Primitives_
- Single-element image wrapper — _React Aria Components_
- Single image element with token sizes — _React Spectrum (Adobe)_
- 11 avatar variants (img + initials + status dot) — _Tailwind Plus UI Blocks_
- Class API: avatar + avatar-{placeholder|online|offline}; ring/mask combinations — _daisyUI_
- Radix-based; Avatar + AvatarImage + AvatarFallback parts — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/avatar) — `Avatar`
- [Ark UI](https://ark-ui.com/docs/components/avatar) — `Avatar`
- [Atlassian Design System](https://atlassian.design/components/avatar/examples) — `Avatar`
- [Base UI](https://base-ui.com/react/components/avatar) — `Avatar`
- [BaseWeb (Uber)](https://baseweb.design/components/avatar/) — `Avatar`
- [Catalyst (Tailwind Labs)](https://catalyst.tailwindui.com/docs/avatar) — `Avatar`
- [Chakra UI](https://chakra-ui.com/docs/components/avatar) — `Avatar`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-avatar--docs) — `Avatar`
- [HeroUI](https://heroui.com/en/docs/react/components/avatar) — `Avatar`
- [MUI (Material UI)](https://mui.com/material-ui/react-avatar/) — `Avatar`
- [Mantine](https://mantine.dev/core/avatar/) — `Avatar`
- [Polaris (Shopify)](https://polaris.shopify.com/components/images-and-icons/avatar) — `Avatar`
- [Primer (GitHub)](https://primer.style/components/avatar) — `Avatar`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/avatar) — `Avatar`
- [React Aria Components](https://react-aria.adobe.com/Avatar) — `Avatar`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Avatar.html) — `Avatar`
- [Tailwind Plus UI Blocks](https://tailwindcss.com/plus/ui-blocks/application-ui/elements/avatars) — `Avatars (UI Blocks)`
- [daisyUI](https://daisyui.com/components/avatar/) — `Avatar`
- [shadcn/ui](https://ui.shadcn.com/docs/components/avatar) — `Avatar`

---

### Form

**Systems including:** 18  |  **Lens:** app  |  **Teseor:** missing

**Category mix:** composite×8, layout×5, primitive×3, complex×2

**Aliases observed:** `Form`, `form`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `onSubmit` | 10 (Atlassian Design System, Base UI, Carbon (IBM), Formik +6 more) |
| `validationBehavior` | 3 (HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `validationErrors` | 3 (HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `onError` | 2 (React Hook Form, react-jsonschema-form (RJSF)) |
| `onReset` | 2 (Formik, React Aria Components) |
| `@submit` | 1 (FormKit) |
| `action` | 1 (React Hook Form) |
| `actions` | 1 (FormKit) |
| `asChild` | 1 (Radix UI Primitives) |
| `control` | 1 (React Hook Form) |
| `encType` | 1 (React Hook Form) |
| `errors` | 1 (Base UI) |
| `fields` | 1 (react-jsonschema-form (RJSF)) |
| `form` | 1 (Ant Design) |
| `formData` | 1 (react-jsonschema-form (RJSF)) |
| `headers` | 1 (React Hook Form) |
| `implicitSubmit` | 1 (Polaris (Shopify)) |
| `incomplete-message` | 1 (FormKit) |
| `initialValues` | 1 (Ant Design) |
| `isDisabled` | 1 (React Spectrum (Adobe)) |
| `isRequired` | 1 (React Spectrum (Adobe)) |
| `labelCol` | 1 (Ant Design) |
| `layout` | 1 (Ant Design) |
| `method` | 1 (React Hook Form) |
| `noValidate` | 1 (Polaris (Shopify)) |
| `onChange` | 1 (react-jsonschema-form (RJSF)) |
| `onClearErrors` | 1 (Base UI) |
| `onClearServerErrors` | 1 (Radix UI Primitives) |
| `onFinish` | 1 (Ant Design) |
| `onInvalid` | 1 (React Aria Components) |
| `onSuccess` | 1 (React Hook Form) |
| `preventDefault` | 1 (Polaris (Shopify)) |
| `schema` | 1 (react-jsonschema-form (RJSF)) |
| `submit-attrs` | 1 (FormKit) |
| `submit-label` | 1 (FormKit) |
| `templates` | 1 (react-jsonschema-form (RJSF)) |
| `uiSchema` | 1 (react-jsonschema-form (RJSF)) |
| `v-model` | 1 (FormKit) |
| `validateMessages` | 1 (Ant Design) |
| `validator` | 1 (react-jsonschema-form (RJSF)) |
| _… +2 more props_ | |

**A11y / ARIA observations:**

- native form semantics — _MVP.css, Simple.css, new.css_
- Native form semantics. — _Carbon (IBM), Polaris (Shopify)_
- Label association via Form.Item; aria-invalid on errors — _Ant Design_
- Field-level labels, helper, error all linked. — _Atlassian Design System_
- Aggregates per-field aria-invalid + Field error binding — _Base UI_
- Wraps \<form\>; submit button and incomplete-message exposed via live region — _FormKit_
- Renders native \<form\>; auto-wires onSubmit/onReset to Formik — _Formik_
- React Aria Form: native form validation + aria-invalid wiring — _HeroUI_
- uses native form semantics — _Pico.css_
- Field/Label/Control/Message wiring with aria-describedby; native + custom validation — _Radix UI Primitives_
- Aggregates field-level aria-invalid/aria-describedby; server-error injection — _React Aria Components_
- Renders \<form\>; defers SR semantics to children — _React Hook Form_
- Native form; aria-describedby for server validation errors — _React Spectrum (Adobe)_
- native form semantics; label associations — _awsm.css_
- Renders \<form\>; per-widget a11y delegated to widget implementations — _react-jsonschema-form (RJSF)_

**Design choices observed:**

- classless form wrapper — _MVP.css, new.css_
- Composite Form + Form.Item + Form.List + Form.useForm; rc-field-form — _Ant Design_
- Render-prop API exposing formProps; FormSection, Field, ErrorMessage, HelperMessage children. — _Atlassian Design System_
- Coordinates server-error injection across child Fields — _Base UI_
- Thin wrapper providing default spacing. — _Carbon (IBM)_
- Form-level orchestrator: handles submit lifecycle, disabled state, aggregated errors, v-model of all child values — _FormKit_
- Thin HTML \<form\> wrapper that auto-calls handleSubmit/handleReset — _Formik_
- Headless form with native/custom validation modes — _HeroUI_
- classless form wrapper with consistent spacing — _Pico.css_
- Thin wrapper over \<form\>. — _Polaris (Shopify)_
- Part-based (Root/Field/Label/Control/Message/ValidityState/Submit); declarative validation matchers — _Radix UI Primitives_
- Native + RAC validation; server-error wiring via validationErrors — _React Aria Components_
- Optional opinionated wrapper that handles fetch submission and success/error callbacks — _React Hook Form_
- Provides validation context; supports native + ARIA validation — _React Spectrum (Adobe)_
- classless form wrapper with spaced controls — _Simple.css_
- structured layout for form\>p\>label patterns and inline checkbox/radio with label — _awsm.css_
- Schema-first root; theme-pluggable via widgets/fields/templates props — _react-jsonschema-form (RJSF)_

**Source URLs:**

- [Ant Design](https://ant.design/components/form) — `Form`
- [Atlassian Design System](https://atlassian.design/components/form/examples) — `Form`
- [Base UI](https://base-ui.com/react/components/form) — `Form`
- [Carbon (IBM)](https://carbondesignsystem.com/components/form/usage/) — `Form`
- [FormKit](https://formkit.com/inputs/form) — `form`
- [Formik](https://formik.org/docs/api/form) — `Form`
- [HeroUI](https://heroui.com/en/docs/react/components/form) — `Form`
- [MVP.css](https://andybrewer.github.io/mvp/) — `Form`
- [Pico.css](https://picocss.com/docs/forms) — `Form`
- [Polaris (Shopify)](https://polaris.shopify.com/components/selection-and-input/form) — `Form`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/form) — `Form`
- [React Aria Components](https://react-aria.adobe.com/Form) — `Form`
- [React Hook Form](https://react-hook-form.com/docs/useform/form) — `Form`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Form.html) — `Form`
- [Simple.css](https://simplecss.org/demo) — `Form`
- [awsm.css](https://unpkg.com/awsm.css/dist/awsm.css) — `Form`
- [new.css](https://newcss.net/demo/) — `Form`
- [react-jsonschema-form (RJSF)](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/form-props) — `Form`

---

### Popover

**Systems including:** 18  |  **Lens:** app  |  **Teseor:** missing

**Category mix:** composite×17, primitive×1

**Aliases observed:** `Floating Panel`, `Popover`, `Popovers`

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `open` | 10 (Ant Design, Ark UI, Base UI, Carbon (IBM) +6 more) |
| `onOpenChange` | 8 (Ark UI, Base UI, Chakra UI, Fluent UI React (v9 / Fluent 2) +4 more) |
| `defaultOpen` | 5 (Ark UI, Base UI, Radix UI Primitives, React Aria Components, shadcn/ui) |
| `modal` | 5 (Ark UI, Base UI, Headless UI (React), Radix UI Primitives, shadcn/ui) |
| `placement` | 5 (Ant Design, BaseWeb (Uber), HeroUI, React Aria Components, React Spectrum (Adobe)) |
| `isOpen` | 3 (BaseWeb (Uber), HeroUI, React Aria Components) |
| `positioning` | 3 (Ark UI, Chakra UI, Fluent UI React (v9 / Fluent 2)) |
| `align` | 2 (Carbon (IBM), Radix UI Primitives) |
| `caret` | 2 (Carbon (IBM), Primer (GitHub)) |
| `content` | 2 (Ant Design, BaseWeb (Uber)) |
| `offset` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `onClose` | 2 (MUI (Material UI), Polaris (Shopify)) |
| `openOnHover` | 2 (Base UI, Fluent UI React (v9 / Fluent 2)) |
| `shouldFlip` | 2 (React Aria Components, React Spectrum (Adobe)) |
| `showArrow` | 2 (BaseWeb (Uber), HeroUI) |
| `trapFocus` | 2 (Fluent UI React (v9 / Fluent 2), Mantine) |
| `withArrow` | 2 (Fluent UI React (v9 / Fluent 2), Mantine) |
| `activator` | 1 (Polaris (Shopify)) |
| `active` | 1 (Polaris (Shopify)) |
| `anchor` | 1 (Headless UI (React)) |
| `anchorEl` | 1 (MUI (Material UI)) |
| `anchorOrigin` | 1 (MUI (Material UI)) |
| `appearance` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `arrow` | 1 (Ant Design) |
| `as` | 1 (Headless UI (React)) |
| `autoAlign` | 1 (Carbon (IBM)) |
| `autofocusTarget` | 1 (Polaris (Shopify)) |
| `backdrop` | 1 (HeroUI) |
| `collisionPadding` | 1 (Radix UI Primitives) |
| `containerPadding` | 1 (React Spectrum (Adobe)) |
| `delay` | 1 (Base UI) |
| `dropShadow` | 1 (Carbon (IBM)) |
| `highContrast` | 1 (Carbon (IBM)) |
| `initialFocusEl` | 1 (Chakra UI) |
| `isNonModal` | 1 (React Aria Components) |
| `marginThreshold` | 1 (MUI (Material UI)) |
| `onChange` | 1 (Mantine) |
| `onClickOutside` | 1 (BaseWeb (Uber)) |
| `opened` | 1 (Mantine) |
| `openOnContext` | 1 (Fluent UI React (v9 / Fluent 2)) |
| _… +17 more props_ | |

**A11y / ARIA observations:**

- role=dialog (non-modal); aria-haspopup on trigger — _Ant Design_
- Dialog pattern within popover; Esc/outside-click dismiss — _Ark UI_
- WAI-ARIA Dialog within popover; Esc/outside-click dismiss — _Base UI_
- aria-expanded on trigger; popover content gets generated id — _BaseWeb (Uber)_
- role=tooltip-like with title/content; opt-in via JS plugin — _Bootstrap_
- Consumer wires aria-describedby/labelledby. — _Carbon (IBM)_
- role=dialog (non-modal); aria-labelledby — _Chakra UI_
- PopoverSurface uses appropriate dialog roles; trigger aria-expanded — _Fluent UI React (v9 / Fluent 2)_
- Disclosure-style popover; click-outside close, Esc close, focus management — _Headless UI (React)_
- React Aria Popover with role=dialog (non-modal) — _HeroUI_
- Modal-backed; aria-labelledby provided by consumer — _MUI (Material UI)_
- role=dialog (non-modal); ARIA wiring on Target — _Mantine_
- Manages focus return; aria-expanded on activator. — _Polaris (Shopify)_
- Visual only; consumer wires aria-describedby. — _Primer (GitHub)_
- WAI-ARIA Dialog pattern; Esc closes; Tab focus management — _Radix UI Primitives_
- WAI-ARIA dialog within popover; Esc/outside click dismiss — _React Aria Components_
- Positioned overlay; aria pattern provided by trigger context — _React Spectrum (Adobe)_
- Radix primitive: role="dialog" non-modal, focus return — _shadcn/ui_

**Design choices observed:**

- Trigger child + content prop — _Ant Design_
- Part-based (Root/Trigger/Anchor/Positioner/Content/Title/Description/Arrow/CloseTrigger) — _Ark UI_
- Part-based (Root/Trigger/Portal/Backdrop/Positioner/Popup/Arrow/Title/Description/Close) — _Base UI_
- Stateful + Stateless; click/hover trigger types; renders into Layer — _BaseWeb (Uber)_
- data-bs-toggle=popover + data-bs-content; Popper.js positioning — _Bootstrap_
- Lower-level surface used by IconButton tooltip and AILabel. — _Carbon (IBM)_
- Composite Popover.\* parts — _Chakra UI_
- Popover + PopoverTrigger + PopoverSurface slot composition with positioning hook — _Fluent UI React (v9 / Fluent 2)_
- Part-based (Popover/PopoverButton/PopoverBackdrop/PopoverPanel/PopoverGroup); render-prop state; Floating UI anchor — _Headless UI (React)_
- Composite Popover + PopoverTrigger + PopoverContent — _HeroUI_
- Built on Modal + Paper; anchor coordinates — _MUI (Material UI)_
- Composite Popover.Target + Dropdown — _Mantine_
- Activator + Pane/Section subcomponents. — _Polaris (Shopify)_
- Caret arrow positioning prop. — _Primer (GitHub)_
- Part-based (Root/Trigger/Anchor/Portal/Content/Arrow/Close); Floating UI positioning — _Radix UI Primitives_
- Triggered via DialogTrigger/MenuTrigger/SelectTrigger etc; render-prop placement state; built-in collision logic — _React Aria Components_
- Low-level overlay used by DialogTrigger/MenuTrigger — _React Spectrum (Adobe)_
- Radix-based; Trigger/Content/Anchor parts — _shadcn/ui_

**Source URLs:**

- [Ant Design](https://ant.design/components/popover) — `Popover`
- [Ark UI](https://ark-ui.com/docs/components/popover) — `Popover`
- [Base UI](https://base-ui.com/react/components/popover) — `Popover`
- [BaseWeb (Uber)](https://baseweb.design/components/popover/) — `Popover`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/popovers/) — `Popovers`
- [Carbon (IBM)](https://github.com/carbon-design-system/carbon/tree/main/packages/react/src/components/Popover) — `Popover`
- [Chakra UI](https://chakra-ui.com/docs/components/popover) — `Popover`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-popover--docs) — `Popover`
- [Headless UI (React)](https://headlessui.com/react/popover) — `Popover`
- [HeroUI](https://heroui.com/en/docs/react/components/popover) — `Popover`
- [MUI (Material UI)](https://mui.com/material-ui/react-popover/) — `Popover`
- [Mantine](https://mantine.dev/core/popover/) — `Popover`
- [Polaris (Shopify)](https://polaris.shopify.com/components/overlays/popover) — `Popover`
- [Primer (GitHub)](https://primer.style/components/popover) — `Popover`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/popover) — `Popover`
- [React Aria Components](https://react-aria.adobe.com/Popover) — `Popover`
- [React Spectrum (Adobe)](https://react-spectrum.adobe.com/react-spectrum/Popover.html) — `Popover`
- [shadcn/ui](https://ui.shadcn.com/docs/components/popover) — `Popover`

---

### Toast

**Systems including:** 15  |  **Lens:** app  |  **Teseor:** missing

**Category mix:** composite×9, primitive×3, complex×2, layout×1

**Aliases observed:** `Snackbar`, `Sonner`, `Toast`, `Toast / Toaster / useToastController`, `Toast.Action`, `Toast.Close`, `Toast.Description`, `Toast.Provider`, `Toast.Root`, `Toast.Title`, `Toast.Viewport`, `Toaster` (+9 more)

**Props observed (frequency across systems):**

| Prop | Systems |
| --- | --- |
| `duration` | 6 (Ark UI, Chakra UI, Radix UI Primitives, Sonner, react-hot-toast, shadcn/ui) |
| `timeout` | 4 (Base UI, Fluent UI React (v9 / Fluent 2), HeroUI, React Aria Components) |
| `action` | 3 (Chakra UI, MUI (Material UI), shadcn/ui) |
| `position` | 3 (Fluent UI React (v9 / Fluent 2), Sonner, react-hot-toast) |
| `autoHideDuration` | 2 (BaseWeb (Uber), MUI (Material UI)) |
| `description` | 2 (Chakra UI, HeroUI) |
| `id` | 2 (Sonner, react-hot-toast) |
| `onClose` | 2 (BaseWeb (Uber), MUI (Material UI)) |
| `open` | 2 (MUI (Material UI), Radix UI Primitives) |
| `priority` | 2 (Base UI, React Aria Components) |
| `swipeDirection` | 2 (Base UI, Radix UI Primitives) |
| `title` | 2 (Chakra UI, HeroUI) |
| `type` | 2 (Base UI, Chakra UI) |
| `variant` | 2 (HeroUI, shadcn/ui) |
| `anchorOrigin` | 1 (MUI (Material UI)) |
| `asChild` | 1 (Radix Toast) |
| `closeable` | 1 (BaseWeb (Uber)) |
| `color` | 1 (HeroUI) |
| `defaultOpen` | 1 (Radix UI Primitives) |
| `gap` | 1 (Ark UI) |
| `intent` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `kind` | 1 (BaseWeb (Uber)) |
| `label` | 1 (Radix UI Primitives) |
| `limit` | 1 (Base UI) |
| `max` | 1 (Ark UI) |
| `message` | 1 (MUI (Material UI)) |
| `onOpenChange` | 1 (Radix UI Primitives) |
| `overlap` | 1 (Ark UI) |
| `overrides` | 1 (BaseWeb (Uber)) |
| `pauseOnHover` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `pauseOnWindowBlur` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `placement` | 1 (Ark UI) |
| `politeness` | 1 (Fluent UI React (v9 / Fluent 2)) |
| `queue` | 1 (React Aria Components) |
| `removeDelay` | 1 (Ark UI) |
| `shouldCloseOnAction` | 1 (React Aria Components) |
| `shouldShowTimeoutProgress` | 1 (HeroUI) |
| `type (foreground\|background)` | 1 (Radix UI Primitives) |

**A11y / ARIA observations:**

- aria-live region with hotkey-jump (Alt+T) and pause-on-hover/focus — _Ark UI_
- aria-live region; F8 hotkey to viewport; pause on hover/focus — _Base UI_
- role=alert (negative) or status (others); dismiss button labelled — _BaseWeb (Uber)_
- role=alert/status with aria-live=assertive/polite — _Bootstrap_
- role=status/alert depending on type; live region — _Chakra UI_
- Toaster is role=status/alert region; per-toast politeness — _Fluent UI React (v9 / Fluent 2)_
- React Aria Toast: role=alert/status live region — _HeroUI_
- role=alert/status via SnackbarContent; ClickAwayListener inside — _MUI (Material UI)_
- Requires aria-label when icon-only — _Radix Toast_
- aria-live regions with foreground/background levels; F8 jumps to viewport; Action altText for SR — _Radix UI Primitives_
- aria-live landmark region; F6 navigation; focus restoration — _React Aria Components_
- Caller responsible for in-toast a11y; container still announces — _Sonner_
- aria-live region expected — _daisyUI_
- Caller wires ariaProps — _react-hot-toast_
- Radix Toast: aria-live region, swipe to dismiss — _shadcn/ui_

**Design choices observed:**

- Part-based (Toaster/Root/Title/Description/ActionTrigger/CloseTrigger); imperative createToaster() API; gesture dismiss — _Ark UI_
- Part-based (Provider/Viewport/Root/Title/Description/Action/Close); imperative useToastManager API — _Base UI_
- ToasterContainer + toaster.\* imperative API; portal via Layer — _BaseWeb (Uber)_
- .toast + .toast-header + .toast-body; .toast-container for stacking; JS plugin manages show/hide — _Bootstrap_
- Imperative toaster API + Toaster.\* parts — _Chakra UI_
- Imperative useToastController API + Toaster portal; Toast slot composition with Title/Body/Actions/Footer — _Fluent UI React (v9 / Fluent 2)_
- ToastProvider + imperative addToast(); placement options — _HeroUI_
- Anchored toast; pair with Alert for severity — _MUI (Material UI)_
- Dismisses parent Root via context — _Radix Toast_
- Part-based (Provider/Viewport/Root/Title/Description/Action/Close); swipe-to-dismiss — _Radix UI Primitives_
- Queue-based imperative API (ToastQueue.add); Part-based (UNSTABLE\_ToastRegion/UNSTABLE\_Toast/UNSTABLE\_ToastList/ToastContent); marked unstable — _React Aria Components_
- JSX-as-first-arg escape hatch keeping Toaster styling shell — _Sonner_
- Fixed-position container holding alerts; toast + toast-{start|center|end|top|middle|bottom} — _daisyUI_
- JSX with no default styling; caller handles full surface — _react-hot-toast_
- Legacy: Radix Toast primitive (Sonner is now recommended) — _shadcn/ui_

**Source URLs:**

- [Ark UI](https://ark-ui.com/docs/components/toast) — `Toast`
- [Base UI](https://base-ui.com/react/components/toast) — `Toast`
- [BaseWeb (Uber)](https://baseweb.design/components/toast/) — `Toast`
- [Bootstrap](https://getbootstrap.com/docs/5.3/components/toasts/) — `Toasts`
- [Chakra UI](https://chakra-ui.com/docs/components/toast) — `Toast`
- [Fluent UI React (v9 / Fluent 2)](https://react.fluentui.dev/?path=/docs/components-toast--docs) — `Toast / Toaster / useToastController`
- [HeroUI](https://heroui.com/en/docs/react/components/toast) — `Toast`
- [MUI (Material UI)](https://mui.com/material-ui/react-snackbar/) — `Snackbar`
- [Radix Toast](https://www.radix-ui.com/primitives/docs/components/toast) — `Toast.Close`
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/components/toast) — `Toast`
- [React Aria Components](https://react-aria.adobe.com/Toast) — `Toast`
- [Sonner](https://sonner.emilkowal.ski/toast) — `toast.custom`
- [daisyUI](https://daisyui.com/components/toast/) — `Toast`
- [react-hot-toast](https://react-hot-toast.com/docs/toast) — `toast.custom`
- [shadcn/ui](https://ui.shadcn.com/docs/components/toast) — `Toast`

---
