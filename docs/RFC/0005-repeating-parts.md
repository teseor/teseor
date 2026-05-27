---
status: draft
proposed: 2026-05-26
decided:
---

# 0005 — spec: repeating parts (variable-length item lists)

## Summary

Add a `repeating: true` flag to `ComponentPart`. A repeating part declares the shape of one item; codegen iterates it over a synthesized array prop on the parent component. The array prop name defaults to the plural of the part name, or is set explicitly via `propName:`. Each item gets a codegen-synthesized required `id: string` field. Two parallel repeating parts that share one array (Tabs' `tab` + `tabPanel`) opt in via a shared `groupKey:` — phase 2; phase 1 ships only single-array repeating. The flat shape exposes a new `FlatSpec.repeating[]` block so the existing flat `props:` map keeps scalar values only. Phase 1 lands schema + flatten + codegen + semantic checks + a non-interactive Pagination stub. Real interactive components wait on the events block ([#690]) and the a11y-expansion block ([#692]).

## Motivation

`parts:` is a fixed named map. Components with N homogeneous children — Pagination's page buttons, Breadcrumb's segments, RadioGroup's options, Menu's items, TagList's tags, Tabs' tabs + panels, Accordion's items, Table's rows + cells, Tree's nodes, Select's options — cannot be expressed.

Today, contributors authoring these specs hit one of three walls:

- **Hand-coded array prop.** Invent an `items: ItemDef[]` prop outside the spec, drop down to a hand-written wrapper, and lose the codegen contract. None of the cross-cutting checks (token contract, vocabulary, a11y, examples ↔ coverage) see it.
- **Fake flattening.** Stretch a single named part across what should be N elements, ship a wrapper that loops, and pretend the spec is honest. The validator can't catch the lie because the shape is technically legal.
- **Skip the component.** Compound components stay out of the registry until the spec layer catches up. Today 7 of the 13 components I walked through last session are blocked on this gap.

The umbrella is [#679]; the originating issue is [#687].

## Detailed design

### Schema change — `ComponentPart`

`ComponentPart` gains two optional fields in phase 1. None affects an existing non-repeating part.

```ts
{
  // … existing fields (element, rootClass, fromChildren, variants, intents,
  // sizes, props, tokens, privateTokens, states, a11y, constraints, motion,
  // parts) …
  repeating?: boolean;
  propName?: string;   // overrides the default plural-of-part-name
}
```

A third field, `groupKey?: string`, lands in **phase 2** alongside the interleave codegen rule. Phase 1 does not declare `groupKey:` in the schema — Zod's `strictObject` rejects an unknown key cleanly, so authors who reach for `groupKey:` early get a schema-validation error pointing at the offending part path. Phase 2 adds the field declaration plus the three groupKey-specific semantic checks at the same time.

`scripts/codegen/src/schema.ts` adds the two fields to both the `ComponentPart` TypeScript type and the `componentPart` Zod object. The rest of the schema is unchanged.

### Semantics

A part with `repeating: true` describes **one item** of a list. The parent component receives an array-typed prop whose element shape is the part's `props:` map plus a synthesized `id: string`. Codegen emits a loop that renders one element per array entry, applying the part's `element`, `rootClass`, and DOM attribute rules per-item.

### Array prop name

```yaml
parts:
  page:
    repeating: true
    propName: pages       # optional override
    element: span
    rootClass: t-pagination-page
    props:
      label:   { type: string,  slot: true, description: "Page label rendered as the item text." }
      current: { type: boolean, description: "Marks the current page." }
```

- Default: plural of the part name, computed as `partName + "s"` (English-naive pluralization is good enough; the override exists for irregulars and disambiguation).
- Override: `propName:` is the final word — codegen uses it verbatim.
- Validation: two repeating siblings cannot land on the same effective name (see § Validator rejections).

### The synthesized `id`

Codegen prepends `id: string` to every item shape. It is required. Authors cannot rename, retype, or omit it. Consumers pass `id` per item; it becomes the React `key` and the Vue `:key` automatically, and is also written to the DOM as `data-id={item.id}` for selector-based testing and a11y wiring later.

Reserving `id` as the item key sidesteps the "what becomes the key?" guesswork that haunts every list-rendering API. Component authors who want a domain-specific identifier (a route id, a row UUID, a slug) name the prop `id` at the call site or set the `id` field to that value.

Reserved: a repeating part that declares a `props.id` entry is a hard error (see § Validator rejections).

### DOM rules per item

Each item prop maps to a DOM attribute on the per-item element by the same rules atomic specs already use:

| `type` | `slot:` | Output |
| --- | --- | --- |
| `boolean` | — | `data-<name>={item.x \|\| undefined}` |
| `string` | `true` | item content (children) |
| `string` | absent / `false` | `data-<name>={item.x}` |
| `number` | — | `data-<name>={item.x}` |

These are the same rules `gen-react` / `gen-vue` apply for a single-element part. The repeating case is the per-item application of an existing rule, not a new one.

### Native HTML attributes

`href`, `aria-*`, `title`, `name`, and other native attributes on the per-item element are out of scope. The same gap exists on atomic specs today — a `Link` spec couldn't emit raw `href` either. Phase-1 Pagination sidesteps the problem by being a **non-navigational stub**: it uses `<span>` for the page element so the missing `href` doesn't fail biome's `useValidAnchor` a11y rule. Real interactive Pagination (with native `href` on an `<a>` element and per-item events) ships with phase 3 once events ([#690]) and native-attr passthrough land. Native-attr passthrough is a separate concern filed if/when it becomes load-bearing.

### Flat shape — new `repeating[]` block

`FlatSpec` gains a new optional block:

```ts
export type FlatRepeatingPart = {
  /** Originating part name (e.g. `page`). */
  partName: string;
  /** Final array prop name on the parent component (e.g. `pages`). */
  propName: string;
  /** Per-part DOM emission. */
  element: string;
  rootClass?: string;
  /** Item shape — same as FlatProp but no __part (origin is partName). */
  itemProps: Record<string, Omit<FlatProp, "__part">>;
  /** Phase 2: shared-array siblings carry the same groupKey. Undefined in phase 1. */
  groupKey?: string;
};

export type FlatSpec = {
  // … existing fields …
  repeating?: FlatRepeatingPart[];
};
```

Repeating parts **do not** flow through the existing flat `props:` map. The flat `props:` map stays scalar (one declaration per prop name). Generators that ignore repeating (e.g. the future docs sections for non-repeating components) keep working without changes. Generators that consume repeating (`gen-react`, `gen-vue`, `gen-contract`, `gen-docs`) read `FlatSpec.repeating[]` explicitly.

`flattenSpec` walks composite parts, branches when it sees `repeating: true`, and pushes a `FlatRepeatingPart` into the new block instead of merging the part's `props:` into the scalar map. The token / state / a11y / motion merging logic is unchanged — those blocks on a repeating part flatten the same way they do on any other part.

### Codegen — per-item iteration

`gen-react` emits, per repeating part:

```tsx
{pages.map((item) => (
  <span
    key={item.id}
    data-id={item.id}
    className="t-pagination-page"
    data-current={item.current || undefined}
  >
    {item.label}
  </span>
))}
```

`gen-vue` emits the same shape via `v-for`:

```vue
<span
  v-for="item in pages"
  :key="item.id"
  :data-id="item.id"
  class="t-pagination-page"
  :data-current="item.current || undefined"
>{{ item.label }}</span>
```

`gen-contract` exposes the array as a typed prop:

```ts
type PaginationProps = {
  pages?: ReadonlyArray<{
    id: string;
    label?: string;
    current?: boolean;
  }>;
};
```

`gen-docs` adds one row per repeating block to the props table, formatted as `pages: PageItem[]` with the item shape rendered as a nested definition list directly underneath.

### Group-level props + per-item rendering

Some components (RadioGroup `name`, Tabs `value`) carry a group-level prop that affects per-item rendering but isn't part of the per-item shape. Those live as **scalar props on a non-repeating sibling part** — the root or a fixed wrapper part. The iteration body reads `item.X` for per-item props and `props.X` for group-level props.

Example sketch (phase 2 surface):

```yaml
parts:
  group:
    element: div
    rootClass: t-radio-group
    props:
      name:  { type: string,  description: "HTML form name shared across options." }
      value: { type: string,  pattern: controllable, description: "Selected option value." }
  option:
    repeating: true
    groupKey: items
    element: input
    props:
      value: { type: string, description: "Option value." }
      label: { type: string, slot: true, description: "Option label." }
```

The iteration body computes `checked = item.value === props.value` and emits `name={props.name}` per item. Phase 1 explicitly **rejects** this combination at the semantic-checks layer (rule 11 below): in a composite with any repeating part, non-repeating siblings may not declare scalar `props:`. The rejection lifts in phase 2 alongside `groupKey:` and the interleave codegen.

### Group-state vs per-item-state

When a parent declares a `pattern: controllable` prop (`value` on RadioGroup, Tabs) and an item's appearance depends on it, the item's "selected" state is **computed from the parent prop**, not stored per item. The pattern is `selected = item.value === props.value`. This is documented in the RFC because the temptation to store `selected: boolean` per item is real and produces two-source-of-truth bugs.

### Phase 2 — `groupKey:`

Two parallel repeating parts in the same composite that should iterate **the same array** (Tabs' `tab` + `tabPanel`, RadioGroup's `option-input` + `option-label`) opt in via a shared `groupKey:`. The iteration is **interleaved** — one pass through the array, both parts emitted per iteration step, in sibling order — when the parts share both the same parent and the same `groupKey`. Parts in different parents with the same `groupKey` get separate loops.

Phase 1 doesn't declare the `groupKey:` field in the schema. The Zod `strictObject` rejects unknown keys, so an author who reaches for `groupKey:` in phase 1 gets a schema-validation error pointing at the offending part path. Phase 2 adds the field and the three groupKey-specific semantic checks together.

### Validator rejections (semantic-checks.ts)

A repeating part triggers one of ten new `Issue`s in phase 1. Three more rules (#6, #7, #9 below) land with the `groupKey:` field in phase 2. The full thirteen-rule table is kept in the RFC for forward visibility — the phase column marks what ships when.

| # | Condition | Phase | Rationale |
| --- | --- | --- | --- |
| 1 | `repeating: true` + `fromChildren: true` | 1 | Contradictory — `fromChildren` consumes wrapped React children; repeating renders from an array prop. |
| 2 | `repeating: true` with no `props:` | 1 | An item shape with zero fields is useless — `id` alone wouldn't render anything. |
| 3 | `repeating: true` + nested `parts:` | 1 | Deferred to [#835]. Phase-1 repeating items are flat. |
| 4 | A repeating part nested inside another repeating part | 1 | Deferred to [#834] (Tree, Table matrix). |
| 5 | Two repeating siblings default to the same `propName` | 1 | Forces explicit disambiguation. Suggestion hint via Levenshtein. |
| 6 | `propName:` and `groupKey:` both set on the same part | 2 | `groupKey` controls the array name; declaring both is contradictory. |
| 7 | Two parts sharing `groupKey:` declare a per-item prop with the same name | 2 | Phase-2 collision; lands with the `groupKey:` field. |
| 8 | A repeating part declares `props.id` | 1 | `id` is codegen-reserved. |
| 9 | A `groupKey:` value is referenced by exactly one repeating part | 2 | `groupKey` only makes sense with ≥ 2 sharers; a lone one means the author wants `propName:`. |
| 10 | Effective `propName` is not a valid JS identifier or collides with a codegen-emitted wrapper local / JS reserved word (e.g. `ref`, `className`, `props`, `rest`, `mergedClassName`, `default`, `let`, `class`, …) | 1 | The generated wrapper would not compile. |
| 11 | Non-repeating part declares scalar `props:` in a composite that has repeating parts | 1 | Group-level scalar props need the `groupKey:` + interleave codegen machinery; deferred to phase 2. |
| 12 | Repeating item prop sets `responsive: true` | 1 | Generators emit a plain scalar field + single `data-*` binding, no per-breakpoint expansion. Spec would lie about the API. Deferred. |
| 13 | List composite has ≠ 1 non-repeating top-level part | 1 | The renderers pick the first non-repeating top-level part as the wrapper; extras are silently dropped, zero throws at generation time. |

Each issue includes the repeating part's dotted `partPath` in `Issue.path` so authors can locate the offending declaration without grepping.

### The phase-1 stub — Pagination

Pagination is the phase-1 stub because it's the simplest candidate that is meaningful without per-item events and without a11y wiring. The stub is **non-navigational**. The page element is `<span>` (not `<a>` — an anchor without `href` fails biome's `useValidAnchor` a11y rule, and native-attr passthrough is out of phase-1 scope). Each item renders with `data-current` per the standard DOM rule. The purpose is to verify the iteration codegen end-to-end (schema → flatten → react/vue/contract/docs), not to ship a usable consumer component. The real, navigation-capable Pagination lands with phase 3 when events ([#690]) and a native-attr passthrough become available — at that point the element switches to `<a>` with real `href` and the per-item event handlers wire up.

Sketch:

```yaml
name: pagination
kind: composite
behavior: none
cssFile: components/pagination/pagination.css

parts:
  root:
    element: nav
    rootClass: t-pagination
    a11y:
      role: navigation
  page:
    repeating: true
    element: span
    rootClass: t-pagination-page
    props:
      label:   { type: string, slot: true, description: "Page label rendered as the item text." }
      current: { type: boolean, responsive: false, description: "Marks the active page." }
```

Resolved flat shape:

```ts
{
  name: "pagination",
  kind: "composite",
  // … root part flattens normally (no scalar props in phase 1) …
  props: {},
  repeating: [{
    partName: "page",
    propName: "pages",
    element: "span",
    rootClass: "t-pagination-page",
    itemProps: { label: …, current: … },
  }],
}
```

Resolved React contract:

```ts
type PaginationProps = {
  pages?: ReadonlyArray<{ id: string; label?: string; current?: boolean }>;
};
```

Real interactive Pagination (event-driven, with `onPageChange`) waits on the events block ([#690]) and lands as part of phase 3 of this ladder.

### Phase ladder

Phase 1 lands the minimum viable repeating layer. The chain below is what each subsequent phase unlocks; the components named are the real ones that become spec-able once the relevant block lands.

1. **Phase 1 ([#687], this RFC).** Schema + flatten + codegen + semantic checks + Pagination stub. No `groupKey:`, no nested fixed parts, no events.
2. **Phase 2 — follow-up issue.** `groupKey:` + interleave rule + simple Tabs labels (still no events). Unblocks the parallel-array case.
3. **Events block ([#690]).** Per-item callbacks (`onSelect`, `onDismiss`, `onPageChange`). Unblocks real Menu, RadioGroup, interactive Pagination, dismissible TagList, Breadcrumb-with-callbacks.
4. **A11y expansion ([#692]).** `aria-controls` / `aria-labelledby` per-item wiring. Unblocks real Tabs.
5. **Nested fixed parts ([#835]).** A repeating part may contain its own non-repeating sub-parts. Unblocks Stepper, Carousel, and wrapped Accordion (AccordionItem with `header` + `panel` sub-parts).
6. **Recursive repeating ([#834]).** A repeating part may contain another repeating part. Unblocks Tree, Table (rows × cells), grouped Select.

Phase 1 is intentionally thin — most of what people picture when they hear "spec supports lists" lives in phases 3–6.

## Drawbacks

- **More semantic-check surface.** Nine new rejection clauses, each with its own message and `partPath` resolution. Two of the nine (groupKey ones) fence phase-2 surface from inside phase-1 — they cost test rows that test the rejection of unbuilt features.
- **Codegen branches.** `gen-react` / `gen-vue` / `gen-contract` / `gen-docs` each grow a per-repeating-part branch. The atomic-spec code path is untouched; composite-spec code paths get one extra walk over `FlatSpec.repeating[]`.
- **`FlatSpec.repeating[]` is a new shape generators must consume.** Any future generator that walks the flat spec needs to know about repeating, or it silently produces incomplete output. The cost is paid once per generator.
- **DOM-attribute rule for plain `string` props is `data-*`, not text content.** A consumer expecting a `string` per-item prop to render as the element's text body needs to flag the prop with `slot: true`. This is the same rule atomic specs already have; the surprise factor is identical.
- **Six-phase ladder is long.** The full real-Tabs / real-Tree story spans five PRs after this one. Some readers will look at phase 1 and conclude "this doesn't ship Tabs yet" — which is correct, and is the right granularity for a layered design.

## Alternatives

### Alternative — sibling `items:` block (rejected last session)

Add a sibling block, parallel to `parts:`, that declares list-shaped repeating elements:

```yaml
parts:
  root: { element: nav, … }
items:
  page:
    element: a
    propShape: { label, href, current }
```

Two top-level concepts, more Zod schema surface, no win on disambiguation (`propName:` is still needed), and `flattenSpec` would need to walk two sources instead of one. Rejected.

### Alternative — array-typed prop on the flat `props:` map

Express the repeating shape as a single synthesized flat prop with `type: "array"` and an `items:` shape:

```ts
props: {
  pages: { type: "array", items: { label: …, current: … }, __part: "page" },
}
```

Pollutes the flat `props:` map — generators that today assume `FlatProp` values are scalar would need defensive branches everywhere, not just in the repeating-aware ones. The new block (`FlatSpec.repeating[]`) keeps the existing flat shape unchanged for all non-repeating-aware code. Rejected.

### Alternative — do nothing

Tabs / Accordion / Tree / Table / Pagination / RadioGroup / Menu / Breadcrumb / TagList / Select / Stepper / Carousel stay outside the spec layer. Each one gets a hand-coded wrapper outside the codegen contract, with its own argument shape and no validator coverage. The drift cost has already shown up — issues filed against the spec layer keep referencing "if we had repeating parts" as the blocker. Rejected.

## Adoption strategy

### Migration window

Additive across all six phases. No consumer-facing breaking change at phase 1 — no published component uses `repeating:` yet, and the schema field is optional. The Pagination stub is a brand-new component.

### Codemod

None. Authors who want to convert a hand-coded wrapper to a repeating spec do so component by component as the relevant phase lands. The migration is a judgment call (which props are per-item, which are group-level), not a mechanical transformation.

### Default vs opt-in

`repeating: true` is explicit on every part that wants the new behavior. Existing parts are unaffected — the absence of the flag preserves today's single-element semantics.

### Backwards compatibility

- Existing atomic specs: unchanged.
- Existing composite specs (Tooltip, Modal, etc.): unchanged.
- Existing `gen-react` / `gen-vue` output for non-repeating parts: byte-identical.
- Consumer wrappers around non-repeating components: unchanged.

The only consumer-visible surface added in phase 1 is the Pagination component itself.

## Unresolved questions

- **Default pluralization for irregular nouns.** `partName + "s"` produces `octopuss` / `childs` / `mouses`. The override (`propName:`) covers it, but the default is surface-level wrong for the irregular cases. Worth shipping with a small irregulars table (mouse → mice, child → children, ...) or shipping naive and relying on the validator's collision-suggestion to nudge authors toward `propName:`? Decision deferred to phase-1 implementation.
- **Whether `id` should also be writable as `aria-labelledby`'s target.** Real Tabs wiring (phase 4) wants the tab's `id` to point at the panel and vice-versa. The cleanest path is `data-id={item.id}` plus codegen-generated `aria-controls={item.id + "-panel"}` later — but the convention for the suffix string ("-panel" vs "-content" vs the part name) is undecided. Defer to phase 4.
- **`groupKey:` value namespace.** A `groupKey: "items"` shouldn't collide with a prop named `items` on a sibling part. The collision is unlikely in practice (group keys are usually thematic — `tabs`, `options` — and prop names are functional). Filed to revisit if a real conflict shows up in phase 2.
- **Whether the validator should auto-suggest `propName:` on rejection #5.** Reasonable; not specified here. Phase-1 implementation call.
- **Stable-id requirement at the type level.** `id: string` is required at the schema layer, but TypeScript can't enforce uniqueness across array entries. Worth a runtime dev-mode assertion in the wrapper? Defer; same trade-off React's `key` warnings already make.

## What this doesn't propose

- **Recursive repeating.** Repeating-inside-repeating (Tree, Table matrix) is [#834], phase 6 of the ladder.
- **Nested fixed sub-parts inside a repeating item.** Stepper's per-step `header` + `description` sub-parts; AccordionItem's `header` + `panel`; Carousel's per-slide `media` + `caption`. Tracked under [#835], phase 5.
- **Per-item events.** `onSelect`, `onDismiss`, `onPageChange`, etc. Tracked under [#690], phase 3.
- **Per-item ARIA wiring.** `aria-controls` / `aria-labelledby` resolution between tab and panel items. Tracked under [#692], phase 4.
- **Tabs / Accordion / Menu / RadioGroup / Breadcrumb / TagList / Select specs.** Each waits on the relevant phase. Real interactive Tabs needs phase 4; wrapped Accordion needs phase 5; Tree needs phase 6.
- **Native-attribute surface (`href`, `aria-*`, `title`).** Same gap exists on atomic specs; not a repeating-specific concern.
- **A "shape reference" mechanism** so Toolbar's three parallel same-shape repeating parts can declare the item shape once and reuse it. Possible future enhancement; phase 1 accepts the duplication (three repeating parts each declare the same `props:` map).

## Lifecycle reminder

- `draft` — opened for discussion. This PR adds the file in `draft`.
- `proposed` — design is stable; phase-1 implementation PR opens.
- `accepted` — phase 1 has merged (schema + flatten + codegen + checks + Pagination stub).
- `rejected` — closed without implementation.
- `superseded` — replaced by a later RFC.

[#679]: https://github.com/teseor/teseor/issues/679
[#687]: https://github.com/teseor/teseor/issues/687
[#690]: https://github.com/teseor/teseor/issues/690
[#692]: https://github.com/teseor/teseor/issues/692
[#834]: https://github.com/teseor/teseor/issues/834
[#835]: https://github.com/teseor/teseor/issues/835
