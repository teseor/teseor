# Spec-format complexity audit

> Research output for issue #855. Inventory of every shape-gating branch in
> the codegen pipeline, classification (essential / accidental / unsure),
> patterns synthesis, and ranked proposals. No code in this pass; follow-up
> issues track each advanced proposal.

## Scope

The codegen pipeline reads `specs/*.yaml`, runs Zod + semantic-checks, flattens
to `FlatSpec`, and emits four artifacts (contract types, React wrappers, Vue
wrappers, docs pages). This audit covers every shape-gating branch in:

- `scripts/codegen/src/schema.ts`
- `scripts/codegen/src/semantic-checks.ts`
- `scripts/codegen/src/lib/flatten.ts`
- `scripts/codegen/src/generators/gen-contract/`
- `scripts/codegen/src/generators/gen-react-19/`
- `scripts/codegen/src/generators/gen-vue-3/`
- `scripts/codegen/src/generators/gen-docs/`

"Shape-gating branch" = code path the spec's declared shape selects (e.g.
`kind === 'atomic'`, `prop.slot === true`, `part.repeating === true`,
`prop.pattern === 'controllable'`, presence of `events:`, presence of
`groupKey:`). Tiny null/early-return branches are excluded.

Out of scope for this pass:

- `scripts/codegen/src/generators/gen-tests/` and
  `scripts/codegen/src/generators/gen-size-limit.ts` — secondary surface;
  likely repeat the same kind-dispatch pattern but not enumerated here.
- Backwards-compat (no published consumers).
- ADR rewrites — each advanced proposal carries its own ADR work.

Current spec population: 5 atomic, 4 composite (`button`, `code`,
`codeblock`, `cluster`, `stack` atomic; `modal`, `tooltip`, `pagination`,
`tablist` composite). Long-tail roadmap is ~60 atoms + a growing composite
set — the figure the issue body cites for migration cost.

## Method

A read-only inventory agent grepped each file for shape-gating tokens
(`kind ===`, `isAtomic`, `isComposite`, `\.repeating\b`, `groupKey`,
`events\b`, `generics\b`, `\bpattern\b`, `\.slot\b`, `interactions\b`,
`overlay\b`, `__part`) and confirmed each hit by reading the surrounding
context. Output: per-file table + per-row classification. Patterns,
proposals, recommendation in this doc are the main-session synthesis.

## Inventory

### `scripts/codegen/src/schema.ts`

| File:line | Gates on | What changes |
| --- | --- | --- |
| schema.ts:280-292 | `kind: "atomic"` vs `kind: "composite"` via `discriminatedUnion` | Atomic spreads `componentNodeFields` at root + allows `slotElement`. Composite has `parts:` map and forbids inline node fields. |
| schema.ts:285 | Atomic-only field `slotElement` | Permitted only when `kind === "atomic"`; composite specs reject it. |
| schema.ts:264-278 | Root-only fields: `overlay`, `interactions`, `generics`, `events`, `guidance`, `examples`, `coverage` | Allowed only at the root union member, never on a `componentPart`. Authoring them on a part fails strictObject with "Unrecognized key". |
| schema.ts:140-149 | Part-only fields: `fromChildren`, `repeating`, `propName`, `groupKey`, nested `parts` | Permitted only on `componentPart`, rejected on the atomic root. |
| schema.ts:36, 115 | `pattern: "controllable"` literal | Single-value enum; only meaningful for boolean props (semantic-checks tightens further). |
| schema.ts:71-84 | Shared node fields (`variants`, `intents`, `sizes`, `props`, `tokens`, `states`, `a11y`, `constraints`, `motion`) | Inlined at root on atomic; nested per-part on composite. Same shape, different placement. |

### `scripts/codegen/src/lib/flatten.ts`

| File:line | Gates on | What changes |
| --- | --- | --- |
| flatten.ts:136 | `spec.kind === "atomic"` | Early returns a FlatSpec built from root-level fields with `__part: ""`. Skips the parts-walk. |
| flatten.ts:172-173 | Root-only `events`/`generics` on atomic | Propagated unchanged to FlatSpec; not declared anywhere else on the atomic branch. |
| flatten.ts:200 | `part.repeating === true` | Part is split out into `repeating[]` (effective propName = `propName ?? groupKey ?? <partName>s`) instead of being merged into root `props`. |
| flatten.ts:208 | `propName ?? groupKey ?? plural` | Three-way fallback for the array prop name; `groupKey` doubles as both grouping identifier and propName. |
| flatten.ts:215 | `part.groupKey` | Forwarded to FlatRepeatingPart so downstream generators can interleave loops. |
| flatten.ts:255-256, 270-271 | Composite branch carries `overlay`/`interactions` (atomic branch doesn't) | All four root-only optional blocks (`overlay`, `interactions`, `events`, `generics`) sit in `identityFields` and are schema-allowed on both kinds; the atomic branch of flatten propagates only `events`/`generics`, dropping `overlay`/`interactions` even when present. |

### `scripts/codegen/src/semantic-checks.ts`

| File:line | Gates on | What changes |
| --- | --- | --- |
| semantic-checks.ts:40-46 | Helpers `isAtomic` / `isComposite` | Two type-guards used throughout to split walk paths. |
| semantic-checks.ts:118-124 | `isAtomic` then `isComposite` in `declaredPublicSlots` | Atomic visits root once. Composite walks parts with collision-aware namespacing. |
| semantic-checks.ts:153 | `spec.overlay?.anchorVar` | Overlay specs add `anchorVar` as a recognized public-slot suffix. |
| semantic-checks.ts:243-253 | `isAtomic` / `isComposite` in `checkTokenFallbacks` | Atomic visits root node. Composite walks parts recursively. |
| semantic-checks.ts:344-373 | `isAtomic` / `isComposite` in `checkPrivateTokens` | Atomic uses root `rootClass`. Composite walks parts. |
| semantic-checks.ts:394 | `!isAtomic(spec)` early return in `checkExamplesReferences` | Composite skipped. |
| semantic-checks.ts:469 | `!isAtomic(spec)` early return in `checkConstraintsAgainstExamples` | Composite skipped. |
| semantic-checks.ts:540 | `!isAtomic(spec)` early return in `checkCoverageShape` | Composite skipped. |
| semantic-checks.ts:581 | `!isAtomic(spec)` early return in `checkConstraintsAgainstCoverage` | Composite skipped. |
| semantic-checks.ts:627 | `!isAtomic(spec)` early return in `checkVocabulary` | Composite skipped (only spec name is checked for both kinds). |
| semantic-checks.ts:733-744 | `isAtomic` / `isComposite` in `checkTokenNames` | Atomic visits root tokens. Composite walks part tokens. |
| semantic-checks.ts:783-792 | `isAtomic` / `isComposite` in `visitNodes` helper | Used by motion/void-element/responsive checks. |
| semantic-checks.ts:941 | `propDef.slot === true` (filter) | Slot props excluded from `data-loading` row in void-element check. |
| semantic-checks.ts:992 | `propDef.slot === true` (continue) | Slot props skipped from `checkResponsiveExplicit`. |
| semantic-checks.ts:1013 | `!isAtomic(spec)` early return in `checkVariantChoiceKeys` | `guidance.variantChoice` keys only checked against `spec.variants` for atomic. |
| semantic-checks.ts:1060-1061 | `isAtomic` / `isComposite` in `collectNumericPropNames` | Atomic visits root props; composite walks parts recursively. |
| semantic-checks.ts:1114 | `!spec.overlay` early return in `checkOverlayEscapeRules` | Escape-rule conflict check only runs when an `overlay:` block is declared. |
| semantic-checks.ts:1190 | `def.pattern === "controllable"` | Collect controllable prop names for event-collision detection. |
| semantic-checks.ts:1236 | `spec.events && length > 0` | Adds `<Name>Event` alias to the reserved-generic set. |
| semantic-checks.ts:1244-1257 | `isAtomic` / `isComposite` in `collectSpecLocalAliases` | Atomic adds root aliases. Composite walks parts; `part.repeating === true` adds item-type alias and skips other aliases. |
| semantic-checks.ts:1249 | `part.repeating === true` | Repeating part contributes item-type alias. |
| semantic-checks.ts:1284-1288 | `typeof part.groupKey === "string"` + `groupKey.toLowerCase() === "items"` | Item-type name: special-case `"items"` → `<Component>Item`; other groupKeys → `<Component><Pascal>Item`. |
| semantic-checks.ts:1301 | `spec.generics ?? []` | Reserved-name / duplicate-name checks fire only when generics declared. |
| semantic-checks.ts:1324-1325 | `spec.events` empty short-circuit | Skip per-event validation if no events declared. |
| semantic-checks.ts:1339-1349 | `isAtomic` / `isComposite` collecting declared prop names for collision check | Composite walk skips repeating parts (`part.repeating === true` continue). |
| semantic-checks.ts:1377-1396 | `synonyms[verb]` + `canonical === "—"` | State-mirror verb tag suggests `pattern: "controllable"` instead of declaring an event. |
| semantic-checks.ts:1406 | `controllableCallbacks.has(name)` | Event name colliding with controllable's `on<Name>Change` callback gets a tailored error. |
| semantic-checks.ts:1450, 1459 | Payload `type === "generic"` / `"builtin"` | Validates `generic.ref` against `generics:`; validates `builtin.name` against vocab. |
| semantic-checks.ts:1508 | `isComposite(s) && Boolean(s.overlay)` in `SUPPORTED_BY_SHAPE` | Runtime-event-source matcher: only composite-overlay supports events today; entry hardcodes `["dismiss"]` and `supportsGenerics: false`. |
| semantic-checks.ts:1531-1540 | `spec.generics.length > 0` + `!shape.supportsGenerics` | Reject generics + events combo when shape's wrapper template doesn't declare type parameters. |
| semantic-checks.ts:1543, 1553 | No matching shape / event name not in shape's allowed set | Rejects declared events on unsupported spec shapes. |
| semantic-checks.ts:1564-1590 | Per-event runtime-payload-reason contract (`dismiss` → enum `["outside","escape","button"]`) | Asserts payload field `reason` matches the wrapper-runtime contract. |
| semantic-checks.ts:1711 | `!isComposite(spec)` early return in `checkRepeatingParts` | All 16 repeating-part rules apply only to composite. |
| semantic-checks.ts:1719 | `part.repeating === true` (tree walk) | Marks `anyRepeating=true`; gates Rule 13 + Rule 3. |
| semantic-checks.ts:1731 | `repeating === true && typeof part.groupKey === "string"` | Build `groupKeyCounts` for lone-groupKey rule. |
| semantic-checks.ts:1748-1769 | `anyRepeating` | Asserts exactly one non-repeating top-level part (Rule 13). |
| semantic-checks.ts:1750 | `p.repeating !== true` (filter) | Pick non-repeating top-level parts as wrapper candidates. |
| semantic-checks.ts:1782 | `part.repeating !== true` (skip) | Only repeating parts in propName-collision detection (Rule 5). |
| semantic-checks.ts:1783 | `propName ?? groupKey ?? <partName>s` | Effective propName precedence (mirrors flatten.ts). |
| semantic-checks.ts:1814 | `part.repeating !== true \|\| typeof part.groupKey !== "string"` (skip) | Only repeating parts with declared groupKey in cross-sibling per-item-prop collision (Rule 7). |
| semantic-checks.ts:1855 | `anyRepeating && part.parts` | List composite forbids nested parts (Rule 3 generalized). |
| semantic-checks.ts:1865-1989 | `part.repeating === true` branch | Rules 1, 2, 4, 6, 8, 9, 10, 12, 14 with sub-conditions on `fromChildren`, empty `props:`, `id` prop name, `propName !== undefined && groupKey: string`, lone groupKey, `def.responsive === true`, non-JS-identifier prop name, invalid effective propName. |
| semantic-checks.ts:1990-2050 | `part.repeating !== true` branch | Rule 15 (`propName`/`groupKey` declared without repeating) + Rule 16 (group-level scalar prop in list composite cannot set `responsive`/`slot`/`pattern: controllable`). |
| semantic-checks.ts:2020 | `anyRepeating` (gates Rule 16) | Rule 16 sub-checks only in list composite. |
| semantic-checks.ts:2031 | `def.slot === true` | Rule 16b: group-level slot prop on non-repeating part rejected. |
| semantic-checks.ts:2040 | `def.pattern === "controllable"` | Rule 16c: group-level controllable prop on non-repeating part rejected. |
| semantic-checks.ts:2054 | `parentIsRepeating \|\| part.repeating === true` | Tracked through recursion for Rule 4 (no nested repeating). |

### `scripts/codegen/src/generators/gen-contract/`

| File:line | Gates on | What changes |
| --- | --- | --- |
| gen-contract/per-spec.ts:19 | `d.responsive === true && d.slot !== true` | `Responsive` import emitted only when at least one non-slot prop is responsive. |
| gen-contract/per-spec.ts:71-80 | `propDef.pattern === "controllable" && propDef.type === "boolean"` | Expands one prop into the controllable triple (`name` + `defaultName` + `onNameChange`). |
| gen-contract/per-spec.ts:95-100 | `propDef.slot === true && !propDef.__part` (atomic-slot detector) | Atomic-slot prop emits `unknown`; composite-part slot keeps the declared scalar type. |
| gen-contract/per-spec.ts:102 | `propDef.responsive === true && propDef.slot !== true` | Wraps base type in `Responsive<…>`; slots skip the wrap. |
| gen-contract/per-spec.ts:111-153 | `spec.repeating` group-by-propName | Parts sharing `groupKey:` merge into one Item type + one array prop. |
| gen-contract/per-spec.ts:159-160 | `spec.generics ?? []` length | Emits `<T1, T2>` generic-param list on `<Name>Props` and `<Name>Event`. |
| gen-contract/per-spec.ts:165-207 | `events:` block presence | Per-event handler props, `<Name>Event` discriminated union, `onEvent` channel only emitted when events declared. |
| gen-contract/per-spec.ts:171 | `def.pattern === "controllable" && def.type === "boolean"` | Pick controllable booleans to add channel-union arms. |
| gen-contract/workspace/barrel.ts:16 | `entry.events && length > 0` | Re-export `<Name>Event` in the barrel only when events declared. |

### `scripts/codegen/src/generators/gen-react-19/`

| File:line | Gates on | What changes |
| --- | --- | --- |
| gen-react.ts:29-33 | `spec.kind === "composite"` + `spec.repeating?.length > 0` | Top-level dispatch: list-composite vs overlay-composite vs atomic. |
| gen-react/_shared/events.ts:28-67 | `spec.events` / `hasEventsBlock` | Per-event prop lines, channel prop, wrapped-handler bodies only when events declared. |
| gen-react/_shared/events.ts:118 | `Object.hasOwn(events, "dismiss")` | Special-cases the `dismiss` runtime-shape adapter. |
| gen-react/_shared/props.ts:17-28 | `propDef.pattern === "controllable" && propDef.type === "boolean"` | Same controllable-triple expansion as gen-contract. |
| gen-react/_shared/type-printer.ts:40-44 | `propDef.slot === true` + `!propDef.__part` | Atomic-root slot → `ReactNode`; composite-part slot → declared scalar type. |
| gen-react/kinds/atomic.ts:92 | `!isVoid && spec.kind === "atomic" && spec.slotElement` | Atomic-only nested wrapper element (e.g. `<pre><code>{children}</code></pre>`). |
| gen-react/kinds/composite-overlay.ts:35-40 | `extractCompositeShape` (overlay anchor + `fromChildren: true`) | Asserts the overlay-with-anchor shape. |
| gen-react/kinds/composite-overlay.ts:41 | `spec.interactions ?? []` | Hook config + memoized array only populated when interactions declared. |
| gen-react/kinds/composite-overlay.ts:46-53 | `pattern === "controllable" && type === "boolean"` | Throws if no controllable boolean prop exists. |
| gen-react/kinds/composite-overlay.ts:58-60 | `d.slot === true && d.__part === overlaySpec.floating` | Content-slot props: must be slot AND on the floating part. |
| gen-react/kinds/composite-overlay.ts:64 | `d.responsive === true && d.slot !== true` | Responsive props rendered as `data-*` attrs. |
| gen-react/kinds/composite-overlay.ts:95 | `def.pattern === "controllable" && def.type === "boolean"` (continue) | Skips controllable triple from destructure (goes to useOverlay config). |
| gen-react/kinds/composite-overlay.ts:127 | `Object.hasOwn(spec.props, "disabled")` | Emits `disabled` into hook config. |
| gen-react/kinds/composite-overlay.ts:134-146 | `spec.events` + `Object.hasOwn(events, "dismiss")` | Wires `onDismiss: handleDismiss` to useOverlay only when dismiss declared. |
| gen-react/kinds/composite-overlay.ts:150 | `overlaySpec.modal` | Adds `modal: true` to useOverlay config; wraps popover in `<Portal>`. |
| gen-react/kinds/composite-list.ts:22 | `p.repeating !== true` (find) | Pick the single wrapper part. |
| gen-react/kinds/composite-list.ts:31-40 | `spec.repeating ?? []` group-by-propName | Same grouping as gen-contract. |
| gen-react/kinds/composite-list.ts:80 | `g.length > 1` (multi-part group) | Adds `Fragment` import and wraps each item. |
| gen-react/kinds/composite-list.ts:176, 189 | `d.slot === true` | Item slot props render as children; non-slot props render as `data-*` attrs. |

### `scripts/codegen/src/generators/gen-vue-3/`

| File:line | Gates on | What changes |
| --- | --- | --- |
| gen-vue.ts:29-33 | `spec.kind === "composite"` + `spec.repeating?.length > 0` | Top-level dispatch (mirror of gen-react). |
| gen-vue/_shared/props.ts:27, 56 | `def.slot !== true` (filter) | Slot props excluded from props type / defineProps destructure — they flow as `<slot name="…" />`. |
| gen-vue/_shared/type-printer.ts:37 | `propDef.slot === true` + `!propDef.__part` | Atomic-slot → `never`; composite-part slot → declared scalar type. |
| gen-vue/kinds/atomic.ts:73 | `!isVoid && spec.kind === "atomic" && spec.slotElement` | Atomic-only nested wrapper template element. |
| gen-vue/kinds/composite-overlay.ts:21-26 | `extractCompositeShape` | Asserts overlay-with-anchor shape (`forbidContentFromChildren: false`). |
| gen-vue/kinds/composite-overlay.ts:27 | `spec.interactions ?? []` | Interaction list in useOverlay config. |
| gen-vue/kinds/composite-overlay.ts:29-36 | `d.pattern === "controllable" && d.type === "boolean"` | Throws if no controllable boolean. |
| gen-vue/kinds/composite-overlay.ts:41 | `d.slot === true && d.__part === overlaySpec.floating` | Content-slot props on the floating part. |
| gen-vue/kinds/composite-overlay.ts:45 | `d.responsive === true && d.slot !== true` | Responsive data-attr binding. |
| gen-vue/kinds/composite-overlay.ts:58, 88 | `pattern === "controllable" && type === "boolean"` (expand / continue) | Expand triple in props type; skip from destructure. |
| gen-vue/kinds/composite-overlay.ts:135 | `overlaySpec.modal && contentRole === "dialog"` | Emits `aria-modal="true"`. |
| gen-vue/kinds/composite-overlay.ts:143 | `overlaySpec.modal` (skip `aria-describedby`) | Modal triggers skip describedby; tooltips include it. |
| gen-vue/kinds/composite-overlay.ts:186 | `Object.hasOwn(spec.props, "disabled")` | Emits `disabled: () => disabled` in hook config. |
| gen-vue/kinds/composite-overlay.ts:189, 219, 230 | `overlaySpec.modal` | Modal overlays wrap popover in `<Teleport to="body">`. |
| gen-vue/kinds/composite-list.ts:20 | `p.repeating !== true` (find wrapper) | Pick the single wrapper. |
| gen-vue/kinds/composite-list.ts:29 | `spec.repeating ?? []` group-by-propName | Same grouping. |
| gen-vue/kinds/composite-list.ts:199, 208, 235, 244 | `d.slot === true` | Item slot props as inline content; non-slot as data-attrs. |

### `scripts/codegen/src/generators/gen-docs/`

| File:line | Gates on | What changes |
| --- | --- | --- |
| gen-docs.ts:74-78 | `spec.kind === "composite"` + `spec.repeating?.length > 0` | Top-level dispatch. |
| gen-docs/_shared/examples.ts:7-9 | `opts.isComposite` | Caller-passed flag (= `spec.kind === "composite"`). Drives Trigger wrapping and rendered/source-attr filtering. |
| gen-docs/_shared/examples.ts:13 | `kind === "composite" && repeating.length > 0` (`isList`) | List composites render self-closing; not wrapped with a Button trigger. |
| gen-docs/_shared/examples.ts:20 | `isComposite && !isList` | Overlay composites get a `<Button>Trigger</Button>` in the docs preview. |
| gen-docs/_shared/examples.ts:31-32 | `isComposite` vs `spec.props?.[key]?.slot !== true` | Atomic strips slot props from rendered preview (kept in source); composite keeps them. |
| gen-docs/_shared/examples.ts:43-47 | `isList` / `isComposite && trigger` | Three source-code shapes: self-closing list; composite-with-trigger; atomic-with-Name-children. |
| gen-docs/_shared/sections.ts:54-69 | `spec.kind !== "composite"` early-return in `hasFromChildrenPart` | Atomic specs never have fromChildren. |
| gen-docs/_shared/sections.ts:74 | `kind === "composite" && repeating.length > 0` | `hasRepeating` gates emitting the Props section when otherwise empty. |
| gen-docs/_shared/sections.ts:83-106 | `def.pattern === "controllable" && def.type === "boolean"` | Expands one row into three (controllable triple). |
| gen-docs/_shared/sections.ts:108 | `def.slot ? "slot" : ""` | Type cell appends "slot" tag. |
| gen-docs/_shared/sections.ts:120 | `kind === "composite" && hasFromChildrenPart(spec)` | Appends synthetic `asChild` row — emitted by the wrapper, not declared in spec. |
| gen-docs/_shared/sections.ts:132 | `kind === "composite" && spec.overlay` | Appends synthetic `ref` row — emitted by overlay composite wrappers. |
| gen-docs/_shared/sections.ts:143-161 | `kind === "composite" && spec.repeating` | One row per repeating-group propName, linking to the `<ItemName>` section. |
| gen-docs/_shared/sections.ts:170 | `kind !== "composite" \|\| !spec.repeating \|\| length === 0` early-return in `renderRepeatingItems` | Item-shape section only emitted for composite-list specs. |
| gen-docs/_shared/sections.ts:186 | `def.slot ? "slot" : ""` | Same slot-tag rendering inside item shape. |
| gen-docs/_shared/sections.ts:253-256 | `spec.overlay` | Overlay-keyboard rows merged into a11y table only for overlay specs. |

## Classification

Per-row tags (E = essential, A = accidental, U = unsure) with one-line reason.

### `schema.ts`

- 280-292 — **E** — fundamental design distinction.
- 285 (`slotElement`) — **U** — one rare convenience (Codeblock's `<pre><code>`). A composite with a nested part could replace it.
- 264-278 root-only fields — **E** for `examples`/`coverage`/`guidance`/`generics`/`events`; **U** for `overlay`/`interactions` (placement choice).
- 140-149 part-only fields — **E** — only meaningful inside a composite parts tree.
- 36, 115 (`pattern: "controllable"`) — **A** — single-literal enum smell; could be a boolean `controllable: true` flag. Note: `behavior:` field at schema.ts:269 overlaps semantically — schema-allowed on both kinds (it sits in `identityFields`), declared on the 4 current composite specs and on none of the atomic specs, read by no generator.
- 71-84 shared node fields — **E** — intentional shape symmetry across atomic root and composite parts.

### `flatten.ts`

- 136 — **E** — atomic flatten is trivially the identity.
- 172-173 (root events/generics on atomic) — **A** — `gen-contract` does read `FlatSpec.events`/`generics` for both kinds (per-spec.ts:159-160, 165-207), but `checkEventsRuntimeSupport` (semantic-checks.ts:1508) rejects atomic specs declaring `events:` — the runtime-support matcher matches no atomic shape today — and no atomic specs declare either field. Carry-through runs but produces empty output. Dead in practice.
- 200 — **E** — repeating parts produce a different consumer surface.
- 208 (three-way propName) — **A** — only exists because `groupKey` doubles as identifier and propName.
- 215 — **E**.
- 255-256, 270-271 — **E** under current root-only placement.

### `semantic-checks.ts`

- 40-46 (`isAtomic`/`isComposite`) — **E** — natural type guards.
- 118-124, 243-253, 344-373, 733-744, 783-792, 1060-1061, 1244-1257, 1339-1349 — **A in aggregate** — each split is essential to its check, but the "atomic visits root, composite walks parts" pattern is duplicated 8 times. `visitNodes` exists at 782 but is used inconsistently.
- 153, 1114, 253-256, 1508 (overlay-gated) — **E** — overlay-specific invariants.
- 394, 469, 540, 581, 627, 1013 (atomic-only checks: examples/constraints/coverage/vocabulary/variantChoice) — **U** — composite specs today don't carry these fields at root, but nothing in the design says they couldn't. If composite grows them, the atomic-only restriction becomes debt.
- 941, 992 — **E** — slot props legitimately bypass certain checks.
- 1190 — **E**.
- 1236 — **E**.
- 1249 — **E**.
- 1284-1288 (`"items"` lowercase special case) — **A** — literal-string special-casing. Either every groupKey goes through `<Component><Pascal>Item` or `itemTypeName:` becomes an explicit field.
- 1301 — **E**.
- 1324-1325 — **E**.
- 1339-1349 — see aggregate.
- 1377-1396 (state-mirror verb `"—"` synonym) — **A** — `"—"` as sentinel in a synonym dictionary is confusing. Belongs in a separate state-mirror-verb table.
- 1406 — **E**.
- 1450, 1459 — **E**.
- 1508 (`SUPPORTED_BY_SHAPE`) — **A** — hardcoded matrix with the single composite-overlay/dismiss entry. The runtime-support contract should be declarative data, not a hand-coded function.
- 1531-1540, 1543, 1553 (generics+events combo) — **A** — same reason as 1508.
- 1564-1590 (`REQUIRED_REASON_VALUES`) — **A** — hardcoded payload contract; per-event data table.
- 1711 — **E**.
- 1719, 1731 — **E**.
- 1748-1769 — **E** — Rule 13 (wrapper count).
- 1750 — **E**.
- 1782, 1783 — **E**.
- 1814 — **E**.
- 1855 — **E**.
- 1865-1989 (the per-rule fork): Rules 1, 2, 4, 5, 7, 8, 10, 13, 14 — **E**. Rules 6, 9, 15 — **A** — they exist purely because `propName` and `groupKey` express overlapping intent. Rule 12 — **U** — codified as "generators don't support it yet". Rules 16a/b/c — **U** — same.
- 1990-2050 — see Rule 16 above.

### Classification — `scripts/codegen/src/generators/gen-contract/`

- per-spec.ts:19 — **E** — code-gen optimization.
- per-spec.ts:71-80 (controllable triple) — **A** — appears verbatim in 4 places (gen-contract, gen-react/_shared/props, gen-vue/composite-overlay, gen-docs/sections).
- per-spec.ts:95-100 (atomic-slot via `__part`) — **A** — appears verbatim in 3 places. The empty-string-as-sentinel is fragile.
- per-spec.ts:102 — **E**.
- per-spec.ts:111-153 — **E** — group-merging is the consumer-facing semantic.
- per-spec.ts:159-160, 165-207, 171 — **E**.
- workspace/barrel.ts:16 — **E**.

### Classification — `scripts/codegen/src/generators/gen-react-19/` and `scripts/codegen/src/generators/gen-vue-3/`

- Top-level dispatch — **E** — three distinct emitter shapes.
- shared events.ts event gating, dismiss specialization — **E** today; **U** as events expand beyond dismiss.
- shared props.ts controllable triple — **A** — duplicate.
- shared type-printer.ts atomic-slot via `__part` — **A** — duplicate.
- kinds atomic.ts `kind === "atomic"` re-check — **E** (redundant inside the atomic renderer, but harmless type-narrowing).
- Overlay-specific gates — **E**.
- `Object.hasOwn(spec.props, "disabled")` — **U** — hardcoded prop name. A general "responsive-state" mechanism would avoid it; not pressing today.
- kinds composite-list.ts find-wrapper / group-multi-part / slot-vs-non-slot — **E**.
- gen-vue shared props.ts:27, 56 slot filter, shared type-printer.ts:37 slot via `__part` — **A** — duplicates of gen-react/contract.

(Bare "shared" / "kinds" segments above name files inside the
`_shared` and `kinds` sub-dirs of each generator dir in the heading;
full paths appear in the inventory tables.)

### Classification — `scripts/codegen/src/generators/gen-docs/`

- gen-docs.ts:74-78 — **E**.
- shared examples.ts `isComposite` + `isList` dispatch — **E** for the rendering distinction. **A** for the implementation (boolean-flag style; three explicit example-shape templates would be clearer).
- shared sections.ts:54-69 (`hasFromChildrenPart` walker) — **A** in implementation — duplicates the private parts-walk at flatten.ts:121 (`visitParts`, not exported today).
- shared sections.ts:83-106 (controllable triple) — **A** — fourth copy.
- 108, 186 — **E**.
- 120 (`asChild` synthetic row) — **A** — generator emits a prop the spec doesn't declare, docs has to mirror it independently.
- 132 (`ref` synthetic row) — **A** — same issue.
- 143-161 — **E**.
- 170 — **E**.
- 253-256 — **E** — universal overlay contract.

### Aggregate count

Rough split across the inventory:

- ~90 shape-gating branches total.
- ~55 essential (~60%).
- ~25 accidental (~28%).
- ~10 unsure (~11%).

The accidental cluster is dominated by **(a)** duplicated atomic/composite walk logic and **(b)** repeated literal patterns (`pattern: "controllable"` triple, `__part` sentinel, `propName`/`groupKey` overlap).

## Patterns

Accidental branches cluster into seven themes. Each lists the rows it covers
and notes whether a single change would collapse them.

### Pattern 1 — `pattern: "controllable"` triple expansion is open-coded four times

**Rows:** schema.ts:36, 115 · semantic-checks.ts:1190, 1406, 2040 · gen-contract/per-spec.ts:71-80, 171 · gen-react/_shared/props.ts:17-28 · gen-react/kinds/composite-overlay.ts:46-53, 95 · gen-vue/kinds/composite-overlay.ts:29-36, 58, 88 · gen-docs/_shared/sections.ts:83-106.

The triple expansion `name + defaultName + onNameChange` is hand-written in
contract, react, vue, and docs. The single-literal `"controllable"` enum is
the only value the field carries, and it only applies to boolean props.
Overlaps semantically with the orphaned `behavior: "stateful"` field at
schema.ts:269 (read by no generator).

### Pattern 2 — Atomic-vs-composite walk duplicated 8 times in semantic-checks

**Rows:** semantic-checks.ts:118-124, 243-253, 344-373, 733-744, 783-792, 1060-1061, 1244-1257, 1339-1349.

Eight functions independently implement "if atomic, visit root once; if
composite, walk parts." `visitNodes` exists at 782 but is only used by the
motion/void/responsive checks.

### Pattern 3 — `propName` / `groupKey` overlap drives 3 rules + 1 literal-string special case

**Rows:** flatten.ts:208 (three-way precedence) · semantic-checks.ts:1284-1288 (`"items"` special case) · Rule 6 (1865-1989) · Rule 9 (lone groupKey) · Rule 15 (`propName`/`groupKey` without `repeating`).

`groupKey` does two jobs: it identifies which sibling parts to interleave,
and it doubles as the array prop name when `propName` is absent. The three
rules exist purely to police the overlap, and the `"items"` lowercase
special case in `itemTypeName` is its tail.

### Pattern 4 — `__part` empty-string sentinel marks atomic-slot vs composite-slot

**Rows:** gen-contract/per-spec.ts:95-100 · gen-react/_shared/type-printer.ts:40-44 · gen-vue/_shared/type-printer.ts:37.

Three generators independently detect "slot prop on atomic root" via
`prop.slot === true && !prop.__part`. The `__part: ""` sentinel from
flatten.ts is fragile: any code path that bypasses flatten and reads the
prop directly sees `undefined`, and both have to be treated equivalently.
A discriminated field on FlatProp would cost ~10 LOC in flatten and
eliminate three open-coded checks.

### Pattern 5 — Runtime-event support matrix is hardcoded across three sites

**Rows:** semantic-checks.ts:1508 (`SUPPORTED_BY_SHAPE`) · semantic-checks.ts:1564-1590 (`REQUIRED_REASON_VALUES`) · gen-react/_shared/events.ts:118 (`Object.hasOwn(events, "dismiss")`) · the equivalent dismiss adapter in gen-vue.

Adding a second runtime-emitted event (e.g. `select`, `submit`) today
requires editing all three sites and likely the wrapper-runtime adapter.
A single per-shape data table (allowed events, required payload shapes,
generic support flag) consumed by both semantic-checks and the per-
framework event emitters would centralize this.

### Pattern 6 — Generator-emitted props are hand-mirrored in docs

**Rows:** gen-docs/_shared/sections.ts:120 (synthetic `asChild`) · gen-docs/_shared/sections.ts:132 (synthetic `ref`).

The wrappers emit `asChild` and `ref` props that the spec doesn't declare.
Docs hand-adds them per overlay/fromChildren detection — a coupling that
has surfaced repeatedly in PR review when a new generator-emitted prop
gets added and the docs row is forgotten. A "generator-contributed props"
registry consumed by both the contract emitter and the docs renderer
would collapse this.

### Pattern 7 — Atomic-vs-composite root shape (the #855 flagship candidate)

**Rows:** schema.ts:280-292 (discriminator) · flatten.ts:136 (atomic short-circuit) · gen-{contract,react,vue,docs} top-level kind dispatch · semantic-checks.ts:394, 469, 540, 581, 627, 1013 (six `!isAtomic` early-returns) · Pattern 2 itself (walk duplication).

`docs/ADR/0009-spec-schema-and-validation.md` kept atomic flat. Today the codebase has 5 atomic + 4 composite
specs (long-tail roadmap ~60 atomic). The audit finds: collapsing the
discriminator would simplify semantic-checks (Pattern 2 collapses to "walk
parts always", six atomic-only early-returns become "walk all parts"),
flatten.ts (one branch), and the schema (a discriminated union becomes a
strict object). The generators still have three modes (single-part-no-
features / overlay / list) but key off `overlay` and `repeating.length`
rather than `kind`. LOC math: ~70 lines removed in semantic-checks,
~30 in flatten, ~20 in schema; ~120 lines of YAML indentation added across
the existing + planned atomic specs. Roughly break-even on LOC, but the
cognitive-load reduction is material — every future feature on the spec
format would otherwise need to choose "root-only or part-only" and answer
six conditional questions about kind-specific checks.

## Proposals

Each proposal carries its own follow-up issue. Cost figures are rough
order-of-magnitude estimates against the current codebase.

### P1 — Shared visitor helpers (`visitProps` / `visitTokens` / `visitNodes`)

**What:** Add three shared traversal helpers to a new file under
`scripts/codegen/src/lib/` (e.g. `visit.ts`). Each takes a `Spec` and a
per-node callback. Refactor the 8 walk-duplication sites in
`scripts/codegen/src/semantic-checks.ts` to use them.

**Cost:** ~150 LOC new helper file (tested). ~80 LOC removed from
`semantic-checks.ts`. No spec migration. Zero behavior change in the
generated output.

**Gain:** One canonical place to express the atomic/composite walk. Future
checks default to "use the visitor"; the temptation to re-open-code the
walk goes away. Pre-requisite for P2 — the visitor needs to exist before
the discriminator can collapse cleanly.

### P2 — Always-composite shape (re-examines `docs/ADR/0009-spec-schema-and-validation.md`)

**What:** Drop the `atomic` / `composite` discriminator. Every spec is
always-composite with one or more parts. A single-element component is
`parts: { root: { ... } }`. Schema becomes a `z.object` with `parts:` as
a required map. `flatten.ts` drops the atomic short-circuit. Semantic-
checks's six `!isAtomic` early-returns become "walk all parts".
Generators still have three modes — single-part-no-features (replaces
"atomic"), overlay, list — but discriminate on `overlay` and
`repeating.length` rather than `kind`.

**Cost:** ~120 LOC of YAML indentation across existing atomic specs (5
today + ~60 planned). ~70 LOC removed from `semantic-checks.ts`, ~30
from `flatten.ts`, ~20 from `schema.ts`. Roughly break-even on LOC.
Existing atomic specs migrate via a one-time script (`yq` or a tiny TS
util). Generators need light edits to dispatch on `overlay` / `repeating`
instead of `kind`.

**Gain:** Cognitive load: every future feature on the spec format
otherwise has to answer "root-only or part-only?" + "atomic-only check?"
The audit found six checks (examples, constraints, coverage, vocabulary,
variantChoice, constraintsAgainstCoverage) tagged atomic-only as
**unsure** — they only fire on atomic today because composite doesn't
declare these fields at root, but the placement is a side-effect of
the discriminator. Drop the discriminator and these become uniform.

**Dependency:** P1 should land first — the visitor's existence is what
makes the always-walk-parts path cheap.

### P3 — Split `groupKey` into `groupId` (identifier) + always-explicit `propName`

**What:** Rename `groupKey:` to `groupId:` and require `propName:` on
every repeating part. `groupId` becomes purely the identifier for "which
sibling parts to interleave"; `propName` becomes the always-explicit
array prop name on the consumer surface. The `"items"` lowercase special
case at semantic-checks.ts:1284-1288 disappears (any item-type-name need
is read from an explicit `itemTypeName:` field, or defaults to
`<Component><Pascal(propName)>Item`).

**Cost:** Schema rename (~5 LOC). Three semantic-check rules removed
(~30 LOC). Flatten.ts three-way precedence collapses to one-way
(~10 LOC). Spec migration: ~4 composite-list specs (`pagination`,
`tablist`, plus any composite-list rollout in flight) get one
field-rename + one always-explicit `propName`.

**Gain:** Eliminates Pattern 3's three rules + the `"items"` literal
special case. The repeating-parts mental model becomes "one identifier,
one prop name" instead of "one field that might be both."

### P4 — Declarative runtime-event support matrix

**What:** Move `SUPPORTED_BY_SHAPE` (semantic-checks.ts:1508) and
`REQUIRED_REASON_VALUES` (1564-1590) into a single data table under
`scripts/codegen/src/lib/` (e.g. `event-runtime-matrix.ts`). The table maps
`spec shape → { allowedEvents, payloadContracts, supportsGenerics }`.
Both semantic-checks (validation) and the per-framework event emitters
(gen-react/_shared/events.ts:118 and Vue equivalent) consume it.

**Cost:** ~80 LOC new data file. ~60 LOC removed across semantic-checks
and the event emitters. No spec migration.

**Gain:** Adding a second runtime-emitted event (e.g. `select`,
`submit`) becomes a single-table edit instead of editing three sites.
Required before the events surface scales beyond `dismiss`.

### P5 — Discriminated `slotKind` on FlatProp

**What:** Add `slotKind: "atomic-root" | "composite-part"` to FlatProp
(`scripts/codegen/src/lib/flatten.ts`). Populate it in flatten based on
where the slot prop was authored. Drop the `__part: ""` sentinel
convention in favor of the discriminator.

**Cost:** ~15 LOC in flatten. ~15 LOC removed across three generators
(gen-contract, gen-react, gen-vue type-printers).

**Gain:** Kills the empty-string sentinel pattern. Any new code path
reading FlatProp gets a typed signal instead of a "did flatten run?"
question.

**Note:** Subsumed by P2 if P2 lands first — under always-composite,
every slot is "composite-part" and the distinction disappears. File
this proposal as a fallback if P2 is deferred.

### P6 — Shared controllable-triple helper

**What:** Add `expandControllableTriple(propName, def)` to a new file
under `scripts/codegen/src/lib/` (e.g. `controllable.ts`). Call it from
gen-contract, gen-react/_shared/props.ts, gen-vue/kinds/composite-overlay.ts,
and gen-docs/_shared/sections.ts.

**Cost:** ~30 LOC new helper. ~80 LOC removed across the four callers.

**Gain:** Pattern 1's four open-coded copies become one. Mechanical
refactor; no spec migration.

### P7 — Generator-contributed props registry

**What:** Add a registry under `scripts/codegen/src/lib/` (e.g.
`synthetic-props.ts`) listing the props that wrappers emit on top of the spec's declared
surface — today `asChild` (when any part declares `fromChildren: true`)
and `ref` (when the spec declares `overlay:`). Both gen-contract and
gen-docs read the registry. gen-docs's two synthetic-row emissions at
sections.ts:120 and 132 become registry-driven instead of independently
matched.

**Cost:** ~30 LOC new registry. ~10 LOC removed in gen-docs/sections.

**Gain:** Future generator-emitted props land in one place rather than in
two independently-maintained sites. Closes a recurring PR-review gap.

## Recommendation

The audit's primary value is the inventory + classification — a durable
record of which branches are essential vs accidental. One follow-up
issue, not seven. The other proposals stay in this doc as signposts and
get done opportunistically when a PR already touches the file.

Spec authoring is the priority: the spec format the author reads and
writes should stay readable. Of the seven proposals, only P2 and P3
affect the spec surface. The stress test below shows both hurt spec
authoring without offsetting clarity gain.

### Stress test against existing + future specs

| Spec | P1 (visitor) | P2 (always-composite) | P3 (`groupKey` / `propName` split) |
| --- | --- | --- | --- |
| `button` (225 LOC) | no effect | +2 lines + reindent | no effect |
| `code` (35 LOC) | no effect | +2 lines ≈ 6% heavier | no effect |
| `codeblock` (36 LOC) | no effect | +2 lines, `slotElement` becomes a nested part | no effect |
| `cluster` (76 LOC), `stack` (63 LOC) | no effect | +2 lines, reindent everything | no effect |
| `modal`, `tooltip` | validator dedupes | already composite | no effect |
| `pagination` | validator dedupes | already composite | gains explicit `propName: pages` (+1 line) |
| `tablist` | validator dedupes | already composite | gains `groupId: items` + `propName: items` on **both** parts (+4 lines of redundancy) |
| `Tabs`, `DataTable`, `Combobox` (future composites) | validator dedupes | already composite | likely repeats the `tablist` redundancy when interleaving |
| Form composition (future, new kind) | validator dedupes | already composite | no effect |
| ~60 future icon/badge atoms | no effect | every one +2 lines | no effect |

P1 helps every current and future composite.
P2 hurts every atom (5 today, ~60 planned). No spec the audit looked at benefits.
P3 forces redundancy in every interleaved-repeating spec.

### Advance (file one follow-up issue)

- **P1 — shared visitor helpers.** Pure internal refactor. ~80 LOC
  removed from `scripts/codegen/src/semantic-checks.ts`. No spec
  change, no behavior change. The visitor PR may also opportunistically
  drop the `"items"` lowercase special case at
  semantic-checks.ts:1284-1288, since it's a tiny touch in adjacent
  code — no separate ticket needed.

### Defer (do opportunistically when touching the file; no ticket)

- **P4 — declarative event matrix.** Worth doing the next time a
  generator PR touches `SUPPORTED_BY_SHAPE` (semantic-checks.ts:1508)
  or `REQUIRED_REASON_VALUES` (1564-1590) — likely when the second
  runtime-emitted event lands.
- **P5 — `slotKind` discriminator on FlatProp.** Do when a generator
  PR touches the slot-type-printing path. Small touch.
- **P6 — shared controllable-triple helper.** Do when a generator PR
  touches any of the four expansion sites.
- **P7 — generator-contributed props registry.** Do when the next
  generator-emitted prop (beyond `asChild` / `ref`) gets added.
- **`slotElement` audit** (schema.ts:285). Revisit when a composite
  spec proves it can replace the field, or when a second consumer
  emerges.
- **`pattern: "controllable"` vs orphaned `behavior:` field overlap**
  (schema.ts:36, schema.ts:269). Revisit when the events / controllable
  surface settles after the second event lands.
- **Hardcoded `disabled` prop name** in overlay useOverlay config
  (gen-react/kinds/composite-overlay.ts:127). Revisit when a second
  responsive-state prop emerges.
- **Dead `events:` / `generics:` carry-through on atomic FlatSpec**
  (flatten.ts:172-173). Five-LOC tidy-up; do when a flatten PR touches
  the file.

### Reject

- **P2 — always-composite.** Spec readability is the priority; the
  stress test shows P2 hurts every atom for no spec-author benefit.
  ADR-0009's `docs/ADR/0009-spec-schema-and-validation.md` rationale
  holds. The internal duplication that motivated P2 in the original
  framing is solved by P1 — a shared visitor — not by collapsing the
  shape.
- **P3 — `groupKey` / `propName` split.** Forces redundancy in every
  interleaved-repeating spec. The three validator rules it would
  eliminate (Rules 6, 9, 15) are real but small, and the `"items"`
  lowercase special case can be dropped without renaming fields.
- **Lift atomic-only restriction on `examples` / `coverage` /
  `variants` / `intents` / `sizes` at composite root.** Net-new
  feature surface; out of audit scope.
- **Remove the orphaned `behavior:` field** (schema.ts:269). Same
  category as the carry-through above — opportunistic cleanup, not a
  proposal.

## What this audit did not examine

- `scripts/codegen/src/generators/gen-tests/` and `gen-size-limit.ts` —
  secondary surface; likely repeat the kind-dispatch pattern but not
  inventoried here.
- `scripts/codegen/src/lib/composite-shape.ts` — called from gen-react
  and gen-vue composite-overlay emitters. Centralizes the
  overlay-anchor / `fromChildren: true` invariant; generators correctly
  delegate. No changes proposed.
- The `behavior:` field at schema.ts:269 — schema-allowed on both
  kinds (it sits in `identityFields`); declared on the 4 current
  composite specs and on none of the atomic specs; read by no
  generator. Flagged under Pattern 1.
- Backwards-compat for spec consumers (none exist; the project is
  pre-release and explicitly forgoes retro-compatibility).
- Generator-implementation style (the `lines.push("<...>")` pattern
  in all four generators). Different question; out of scope for a
  spec-format audit. Worth its own RFC if pursued.
