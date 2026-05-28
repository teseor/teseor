---
status: draft
proposed: 2026-05-28
decided:
---

# 0006 — spec: events block (consumer event surface)

## Summary

Add an `events:` block to the component spec. Each declared event names a
semantic action (the consumer's perspective) plus a typed payload. Codegen
emits **two surface shapes per component from the same source**: a typed
per-event prop (`onSelect`, `onDismiss`, …) for ergonomic call-site code, and
a single discriminated `onEvent` channel for analytics and aggregation. Event
names must use a registered verb from `specs/_vocabulary.yaml`; synonyms are
rejected with suggestions. Payload types are structured under a closed type
vocabulary (`string` / `number` / `boolean` / `enum` / `generic` / `builtin`
/ `array`) — no embedded TypeScript strings, no escape hatches. The `events:`
block is independent from the existing `interactions:` block; the two evolve
on their own timelines until usage shows whether they should converge.

## Motivation

The spec layer has no field for outward-facing component events. Today a
consumer writing a wrapped `Modal`, `Combobox`, `DataTable`, or `Pagination`
either reads private internals or accepts that the component cannot be
observed from the application layer. Concretely:

- **`pattern: "controllable"` only solves the state mirror.** It generates
  `onOpenChange` / `onValueChange` automatically — but `dismiss(reason)`,
  `select(item)`, `rowClick(row, index)`, `pageChange(page)` are *not* state
  mirrors; they're semantic actions the consumer needs to react to without
  introspecting state diffs.
- **Native DOM event spread is too low-level for compound components.**
  `<Button onClick>` works through `Omit<…>`-based prop spread; a
  `<DataTable onRowClick>` cannot, because the click hits a `<tr>` deep
  inside the rendered tree and the consumer cannot tell which row was hit
  without reading `data-*` attributes.
- **Codegen has no surface to emit.** When the spec doesn't declare an event,
  the wrapper either drops it (Modal cannot tell the consumer *why* it
  closed) or invents a non-spec hand-coded prop (loses the contract; every
  cross-cutting check — token contract, vocab, docs — stops seeing it).
- **Analytics integration has no single attach point.** Every consumer that
  wires PostHog / Datadog / Segment writes per-component per-event handlers.
  A single channel that emits everything (with a typed discriminator) costs
  ~10 lines of codegen per spec and removes that boilerplate everywhere.

The originating issue is [#690]; the design discussion is [#746]; the
adjacent analytics layer is [#669]; the umbrella is [#679].

## Detailed design

### Schema change — `events:` block on the component node

A new optional field on `componentNodeFields` (and so available on every
atomic-spec root and every part), but only the **root** position is supported
in v1. The validator rejects `events:` declared on a sub-part.

```ts
// Every variant carries an optional `nullable: true`. The variant body
// describes the non-null shape; nullable promotes it to (shape | null).
type PayloadEntry =
  | { type: "string";  nullable?: boolean }
  | { type: "number";  nullable?: boolean }
  | { type: "boolean"; nullable?: boolean }
  | { type: "enum";    values: string[]; nullable?: boolean }
  | { type: "generic"; ref: string;      nullable?: boolean }
  | { type: "builtin"; name: BuiltinName; nullable?: boolean }
  | { type: "array";   of: PayloadEntry;  nullable?: boolean };

const payloadEntry: z.ZodType<PayloadEntry> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.strictObject({ type: z.literal("string"),  nullable: z.boolean().optional() }),
    z.strictObject({ type: z.literal("number"),  nullable: z.boolean().optional() }),
    z.strictObject({ type: z.literal("boolean"), nullable: z.boolean().optional() }),
    z.strictObject({
      type:     z.literal("enum"),
      values:   z.array(z.string()).min(1),
      nullable: z.boolean().optional(),
    }),
    z.strictObject({
      type:     z.literal("generic"),
      ref:      z.string().min(1),
      nullable: z.boolean().optional(),
    }),
    z.strictObject({
      type:     z.literal("builtin"),
      name:     z.enum([
        "Date", "MouseEvent", "KeyboardEvent", "PointerEvent",
        "FocusEvent", "File", "Error", "HTMLElement",
      ]),
      nullable: z.boolean().optional(),
    }),
    z.strictObject({
      type:     z.literal("array"),
      of:       payloadEntry,
      nullable: z.boolean().optional(),
    }),
  ]),
);

const eventEntry = z.strictObject({
  description: z.string().min(1),
  payload: z.record(z.string(), payloadEntry).default({}),
});

// Generics are unconstrained in v1. A spec author declares the name and
// description; consumers pass whatever type they want at the call site.
// If a real case demands `Row extends Record<string, unknown>`, the
// constraint vocabulary is a follow-up — adding raw TypeScript constraint
// strings would be an escape hatch (see § "No escape hatches").
const genericEntry = z.strictObject({
  name: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
  description: z.string().min(1),
});

// On atomicSpec / compositeSpec (root level only):
//   generics: z.array(genericEntry).optional(),
//   events: z.record(z.string(), eventEntry).optional(),
```

The `events:` map key is the **event name**, validated against the vocab
(see § Vocabulary). The value carries the `description` (required, surfaced
to docs) and the `payload:` map (required to exist; allowed to be empty for
no-payload events like `endReached`).

### Vocabulary — one file, one source

`specs/_vocabulary.yaml` already carries `events:` (a flat verb list). This
RFC extends that into a structured block with verbs, synonyms, and type
metadata:

```yaml
# specs/_vocabulary.yaml

events:
  # Verb registry — last camelCase token of every event name MUST be here.
  verbs:
    # — User-initiated actions
    activate:    "Primary action triggered (click + Enter + Space)."
    select:      "User chose an item from a set."
    submit:      "User confirmed a value or form."
    cancel:      "User explicitly cancelled an action."
    clear:       "User cleared a value back to empty."
    dismiss:     "Surface closed (outside, escape, button — payload carries reason)."
    expand:      "Region expanded."
    collapse:    "Region collapsed."
    edit:        "Edit lifecycle (start, commit, cancel)."
    reorder:     "Items reordered by the user."
    retry:       "User retried a failed operation."
    abort:       "User aborted an in-progress operation."
    add:         "Item was added to a collection."
    remove:      "Item was removed from a collection."

    # — Pure state-change verb
    change:      "A value changed. Bare 'change' or '<noun>Change'."

    # — Sub-element gestures
    click:       "Click on a named sub-element (row, cell, column header)."
    doubleClick: "Double click on a sub-element."
    hover:       "Pointer entered a sub-element."
    focus:       "Focus moved into a sub-element."
    blur:        "Focus left a sub-element."
    drag:        "Drag lifecycle (start, over, end)."
    drop:        "Drop completed."
    resize:      "Element was resized."

    # — Lifecycle / async
    load:        "Resource load completed successfully."
    start:       "Operation started."
    complete:    "Operation completed successfully."
    progress:    "Long-running operation reported progress."
    error:       "Operation failed with an error (DOM-convention noun-verb)."
    reach:       "Sentinel reached (used by 'endReach' for infinite scroll)."

  # Synonyms — author writes the key, validator suggests the value, hard reject.
  # Value '—' means "use the controllable pair (open/onOpenChange) instead."
  # Verbs listed above are NOT also listed here — cancel and dismiss are
  # distinct ('cancel' = user explicit, 'dismiss' = any-reason surface close).
  synonyms:
    close:    dismiss
    hide:     dismiss
    update:   change
    modify:   change
    toggle:   change
    input:    change
    press:    activate       # React Aria's idiom; we standardize on 'activate'.
    open:     "—"            # state mirror is handled by pattern: controllable.

  # Event-name pattern — '<verb>' or '<subjectNoun><Verb>' (camelCase).
  # The LAST camelCase token must be a registered verb (lowercased).
  pattern: "^([a-z]+|[a-z]+([A-Z][a-zA-Z0-9]+)+)$"

  # Built-in types the payload vocabulary allows. Extending this list is the
  # same review gate as adding a verb — vocab PR, single line + description.
  builtins:
    Date:         "ECMAScript Date instance."
    MouseEvent:   "DOM MouseEvent."
    KeyboardEvent:"DOM KeyboardEvent."
    PointerEvent: "DOM PointerEvent."
    FocusEvent:   "DOM FocusEvent."
    File:         "DOM File (uploads, drag-drop)."
    Error:        "ECMAScript Error subclass."
    HTMLElement:  "DOM HTMLElement (target references)."
```

Two cross-cutting properties of this file:

1. **Single source.** Verbs, synonyms, type vocabulary all live here. No
   string lives in two places: every consumer of the vocab (validator,
   codegen, gen-docs) imports a generated TS module.
2. **Generated TS mirror.** `pnpm gen` produces
   `scripts/codegen/src/lib/vocabulary.ts` with typed exports:

   ```ts
   export const eventVerbs = ["activate", "select", ...] as const;
   export type EventVerb = (typeof eventVerbs)[number];
   export const eventSynonyms: Record<string, EventVerb | "—"> = { ... };
   export const builtinTypes = ["Date", "MouseEvent", ...] as const;
   export type BuiltinType = (typeof builtinTypes)[number];
   ```

   Validator and code generators import from this module. Adding a verb is
   one line in YAML; the generated TS keeps the typed surface honest with
   zero hand-editing.

### Validator rules — `validate-spec.ts`

Eight new semantic checks, each surfacing `Issue.path` like the existing
phase-1 / phase-2 rules from RFC-0005:

| # | Condition | Message shape |
| --- | --- | --- |
| E1 | Event name doesn't match the pattern | `'sort_change' is not a valid event name. Use camelCase: '<verb>' or '<subjectNoun><Verb>'.` |
| E2 | Last camelCase token isn't a registered verb | `'sortMutate' verb 'mutate' is not registered. Did you mean 'change'?` (Levenshtein suggestion via the existing `suggest()` helper.) |
| E3 | Name matches a registered synonym | `'close' is registered as a synonym for 'dismiss'. Use 'dismiss' to keep names consistent across components.` |
| E4 | Name matches a synonym whose canonical is `—` | `'open' is the state mirror of an open prop. Declare 'pattern: \"controllable\"' on the open prop instead of an event.` |
| E5 | `payload[field].type: generic` with `ref:` not in the spec's `generics:` block | `Event 'rowClick' payload.row references generic 'Row' which is not declared in this spec's generics: block.` |
| E6 | `payload[field].type: builtin` with `name:` not in vocab `builtins:` | `Event 'fileAdd' payload.file references built-in type 'Blob' which is not registered. Add it to _vocabulary.yaml.` |
| E7 | Event declared on a sub-part (not root) | `events: must be declared on the spec root, not on parts.<name>.` |
| E8 | Event name collides with a controllable callback name | `Event 'valueChange' collides with the auto-emitted onValueChange callback from pattern: \"controllable\" on prop 'value'. Pick a distinct name or remove the controllable pattern.` |

The validator imports verbs/synonyms/builtins from the generated TS module
(§ "Generated TS mirror" above), so a single typo in `_vocabulary.yaml`
fails at build time, not silently at validate time.

### Consumer surface — surface (C) layered

Every spec with a non-empty `events:` block gets **two callable surfaces** on
the generated wrapper, emitted from the same spec entries:

**Per-event props** — one typed prop per declared event:

```tsx
<Combobox<User>
  onSelect={(e) => track(e.item)}              // declared event
  onDismiss={(e) => track(e.reason)}           // declared event
  onInputChange={(e) => fetch(e.value)}        // declared event
  // ...plus controllable callbacks from pattern: "controllable":
  value={v} onValueChange={setV}
  open={o} onOpenChange={setO}
/>
```

**Single discriminated channel** — one prop per component carrying the
discriminated union:

```tsx
<Combobox<User>
  onEvent={(e) => {
    if (e.type === "select") track(e.item);
    if (e.type === "valueChange") analytics.capture(e);
  }}
/>
```

`onEvent` fires for **both declared events and controllable callbacks**.
The discriminated union codegen produces:

```ts
type ComboboxEvent<Item> =
  | { type: "select"; item: Item; index: number }
  | { type: "dismiss"; reason: "outside" | "escape" | "button" }
  | { type: "inputChange"; value: string }
  | { type: "valueChange"; value: Item | null }   // from controllable
  | { type: "openChange"; value: boolean };       // from controllable
```

### Ordering — deterministic, documented

When a single user gesture triggers both a declared event and a controllable
change (Modal close: `dismiss` + `openChange`), the wrapper fires in a fixed
sequence. The channel (`onEvent`) fires **per emission** — once for the
declared event, once for the state mirror.

Order for the Modal-close example (Escape pressed while open):

1. `props.onDismiss?.({ reason: "escape" })` — per-event handler for the
   declared event.
2. `props.onEvent?.({ type: "dismiss", reason: "escape" })` — channel sees
   the declared event.
3. `props.onOpenChange?.(false)` — controllable callback (state mirror).
4. `props.onEvent?.({ type: "openChange", value: false })` — channel sees
   the state mirror.

The pattern is **per-event handler → channel for that event** repeated for
each emission. Declared events always fire before their corresponding state
mirror so consumer code can read the semantic reason without racing the
state update.

### Vue parity

Vue ships the same two surfaces:

- **Per-event emits** — `@dismiss="fn"`, `@select="fn"`, `@row-click="fn"`
  (kebab-cased at the template layer; camelCased canonical name in the
  declared `defineEmits` block).
- **Channel** — `@event="fn"` (literal event name `event`, payload is the
  same discriminated union).

The internal emit name (`emit('dismiss', payload)`) and the prop name on
the React side (`props.onDismiss`) both reference the **same canonical
string** read from the spec — no duplicate string literals.

### Stress test — what the spec looks like across the component spectrum

#### Button (stateless, no declared events)

```yaml
name: button
kind: atomic
behavior: none
# No events: block — native onClick spreads through.
```

Generated surface: no `onEvent` prop. No per-event props. Native
`<Button onClick={fn}>` works via existing `Omit<…>` spread.

#### Modal (stateful, one declared event with reason)

```yaml
name: modal
kind: composite
behavior: stateful

events:
  dismiss:
    description: "Surface closed; payload carries the reason."
    payload:
      reason:
        type: enum
        values: ["outside", "escape", "button"]
```

Generated surface (React):

```ts
type ModalEvent =
  | { type: "dismiss"; reason: "outside" | "escape" | "button" }
  | { type: "openChange"; value: boolean };       // from controllable

interface ModalProps {
  open?: boolean;                                  // controllable
  onOpenChange?: (value: boolean) => void;         // controllable
  onDismiss?: (e: { reason: "outside" | "escape" | "button" }) => void;
  onEvent?: (e: ModalEvent) => void;
}
```

#### Combobox (stateful, generic, multiple events)

```yaml
name: combobox
kind: composite
behavior: stateful

generics:
  - name: Item
    description: "Shape of one combobox item."

events:
  select:
    description: "User chose an item."
    payload:
      item: { type: generic, ref: Item }
      index: { type: number }
  dismiss:
    description: "Listbox closed."
    payload:
      reason:
        type: enum
        values: ["outside", "escape", "select"]
  inputChange:
    description: "Input field text changed (distinct from value change)."
    payload:
      value: { type: string }
  highlightChange:
    description: "Keyboard highlight moved (for analytics)."
    payload:
      item: { type: generic, ref: Item }
      index: { type: number }
  clear:
    description: "User cleared the value."
    payload: {}
```

Generated discriminated union:

```ts
type ComboboxEvent<Item> =
  | { type: "select"; item: Item; index: number }
  | { type: "dismiss"; reason: "outside" | "escape" | "select" }
  | { type: "inputChange"; value: string }
  | { type: "highlightChange"; item: Item; index: number }
  | { type: "clear" }
  | { type: "valueChange"; value: Item | null }
  | { type: "openChange"; value: boolean };
```

Five per-event props + two controllable + one channel = **8 callback
props**. Each name appears once in the spec; codegen produces every surface
form from that single declaration.

#### DataTable (stress — 12+ events)

```yaml
name: data-table
kind: composite
behavior: stateful

generics:
  - name: Row
    description: "Shape of one data row."

events:
  rowClick:
    description: "User clicked a row."
    payload:
      row:   { type: generic, ref: Row }
      index: { type: number }
  rowDoubleClick:
    description: "User double-clicked a row."
    payload:
      row:   { type: generic, ref: Row }
      index: { type: number }
  sortChange:
    description: "Sort changed."
    payload:
      column:    { type: string }
      direction:
        type: enum
        values: ["asc", "desc"]
        nullable: true
  filterChange:
    description: "Filter changed."
    payload:
      column: { type: string }
      value:  { type: string, nullable: true }
  pageChange:
    description: "Active page changed."
    payload:
      page: { type: number }
  columnResize:
    description: "Column was resized by the user."
    payload:
      column: { type: string }
      width:  { type: number }
  columnReorder:
    description: "Columns were reordered."
    payload:
      from: { type: number }
      to:   { type: number }
  expandChange:
    description: "Row expanded or collapsed."
    payload:
      row:      { type: generic, ref: Row }
      expanded: { type: boolean }
  endReach:
    description: "Scroll sentinel reached the end of the list."
    payload: {}
```

Nine declared events + (likely) three controllable pairs (`selectedRows`,
`sortBy`, `page`) = **12 callback props plus the channel**. All event names
parse cleanly under the vocab pattern: `rowClick`, `pageChange`, etc.
`endReach` parses as `end` + `Reach` (verb `reach`).

**Event names use the base-form verb**, not the past tense (`endReach`,
not `endReached`; `fileAdd`, not `fileAdded`). The vocab pattern enforces
this so the registry stays a single canonical list — adding past-tense
aliases would either bloat the registry or require a stemmer with
irregular-verb edge cases. The minor English-awkwardness of `onEndReach`
vs `onEndReached` is the trade for never having two valid names for the
same event.

#### FileUpload (built-ins, no generics)

```yaml
name: file-upload
kind: composite
behavior: stateful

events:
  fileAdd:
    description: "A file was added to the upload queue."
    payload:
      file: { type: builtin, name: File }
  uploadStart:
    description: "Upload began for a file."
    payload:
      file: { type: builtin, name: File }
  uploadProgress:
    description: "Upload progress reported for a file."
    payload:
      file:          { type: builtin, name: File }
      bytesUploaded: { type: number }
      bytesTotal:    { type: number }
  uploadComplete:
    description: "Upload finished successfully."
    payload:
      file: { type: builtin, name: File }
  uploadError:
    description: "Upload failed."
    payload:
      file:  { type: builtin, name: File }
      error: { type: builtin, name: Error }
```

#### Calendar (built-in Date)

```yaml
events:
  dateHover:
    description: "Pointer hovered over a date in the grid (range preview)."
    payload:
      date: { type: builtin, name: Date }
  monthChange:
    description: "Visible month changed."
    payload:
      month: { type: number }
      year:  { type: number }
  viewChange:
    description: "Calendar view changed."
    payload:
      view:
        type: enum
        values: ["day", "month", "year"]
```

### Codegen — what changes

Four generators grow a per-events-block branch. The atomic-spec code path
without `events:` is byte-identical to today.

- **`gen-contract`** — emits the per-event prop types, the `<Spec>Event`
  discriminated union, the spec's `generics:` as TypeScript type parameters
  on the props interface, and `onEvent?: (e: <Spec>Event<...>) => void`.
- **`gen-react`** — wires per-event prop calls inside the wrapper handlers,
  emits the `onEvent` channel-fire alongside, applies the ordering rule.
- **`gen-vue`** — emits `defineEmits` per declared event plus the literal
  `event` emit for the channel; templates use kebab-case `@row-click`.
- **`gen-docs`** — renders the new four-section split (see § Docs).

### Docs — four-section split

The current single `## Props` table becomes four role-keyed sections.
Renderer infers each prop's section from existing markers (no schema
change): `slot: true` → Content; `pattern: "controllable"` → State (pairs
documented adjacent); declared events → Events; everything else →
Configuration.

| Section | What it contains |
| --- | --- |
| `## Configuration` | Visual + behavioral config (variant, size, intent, disabled, density…). |
| `## Content` | Slot props, `children`, `icon`, item-template slots. |
| `## State` | Controllable pairs documented adjacent (`value` / `onValueChange`, `open` / `onOpenChange`). |
| `## Events` | Declared events + the `onEvent` channel. |

Touches the `renderProps` function in
`scripts/codegen/src/generators/gen-docs/_shared/sections.ts` — split into
`renderConfiguration` / `renderContent` / `renderState` / `renderEvents`.
Hardcoded composite-emitted props (`asChild`, `ref`) keep needing explicit
rows per the existing pattern; they're routed to whichever section matches
their role.

### Naming consistency — inside and outside the component

The same canonical string flows through every surface from one source:

| Where | Form |
| --- | --- |
| Spec YAML | `events: { dismiss: { … } }` |
| Generated discriminated union | `\| { type: "dismiss"; reason: ... }` |
| React per-event prop | `onDismiss?: (e: { reason: ... }) => void` |
| React wrapper handler | `props.onDismiss?.({ reason })` |
| Vue emit declaration | `defineEmits<{ dismiss: [payload: …] }>()` |
| Vue template usage | `@dismiss="fn"` |
| Channel payload | `{ type: "dismiss", reason: ... }` |
| Docs table entry | `dismiss` |
| Generated vocab TS | `eventVerbs[2] === "dismiss"` |

No string appears twice in hand-written source. Codegen produces every
casing from the spec's `dismiss` key.

### No escape hatches

Three explicit rejections:

1. **No raw TypeScript strings in `payload:`.** Authors cannot write
   `payload: "{ row: T; index: number }"`. Every payload field uses the
   structured form.
2. **No `unknown` / `any` / `never` types.** If a payload value can't be
   typed at spec time, either (a) declare a generic and pass it through,
   or (b) redesign the payload to carry identifiers the consumer uses to
   look up the value in data they already own (e.g., `cellEdit` carries
   `{ row, columnId }`, not `{ oldValue, newValue }`).
3. **No raw `builtin` names.** Adding a new built-in type
   (`ResizeObserverEntry`, `URL`) is a one-line vocab PR; the validator
   rejects unregistered names until that lands.

The principle: **when the rules don't fit a new case, the rules expand —
we don't add bypasses.**

## Drawbacks

- **Vocab maintenance.** `_vocabulary.yaml` becomes the bottleneck for every
  new event verb or built-in type. Cost is one line + description per
  addition; review gate matches token additions. Tolerable for the
  consistency it buys.
- **Validator surface.** Eight new semantic-check rules. The
  `semantic-checks.ts` file is already large (~1700 LOC per the active
  300-LOC audit, [#838]); this RFC pushes it further. Audit task remains
  open.
- **Codegen branches across four generators.** `gen-react`, `gen-vue`,
  `gen-contract`, `gen-docs` each grow an events branch. Atomic-spec output
  for components without an `events:` block is byte-identical to today.
- **`onEvent` channel doubles the surface in the type definition.** The
  discriminated union for a 12-event DataTable is a 12-arm type; TypeScript
  type-checks it fine but the symbol weight at hover is real.
- **Vue's `@event` channel is slightly foreign.** Vue developers expect
  per-event `@dismiss`-style emits; the literal `event` channel reads as a
  meta-emit. Documented; not deep cost.
- **Doc rendering rewrite.** `renderProps` becomes four functions. Small
  churn in `scripts/codegen/src/generators/gen-docs/_shared/sections.ts`.
- **No state-machine generalization.** Today's narrow `interactions:` block
  stays as-is; the events RFC parks the state-machine question. Risk:
  later, if we generalize `interactions:` to a real machine, some events
  might want to be derived from transitions and we'd refactor. Cost
  evaluated against waiting: drafting both at once means designing the
  state model blind. Worth the deferral.

## Alternatives

### Alternative — couple events to a generalized `interactions:` machine

Promote `interactions:` to a real statechart (Zag/xstate-shaped: states,
guards, actions, emits) and derive events purely from transition emissions.
Single semantic source.

Trade-offs:

- Cleaner end state — every event has a transition; no parallel vocabularies.
- Forces deciding the statechart vocabulary now, with only two components
  (Modal, Tooltip) using `interactions:` today and that vocabulary intentionally
  narrow (`open|close|toggle`). Designing for 8 unbuilt components in advance
  is the kind of upfront over-design ADR-0001 warned against.
- Defers events shipping by ≥ 1 phase while the statechart vocabulary settles.

Rejected for now; revisited when 3–4 more stateful components exist. The
events block is structured so a future "transitions-emit-events" link
(via an optional `emittedBy:` field) can attach without breaking specs.

### Alternative — single `onEvent` channel only (no per-event props)

Spectrum's `onAction` taken to its conclusion: every component exposes one
prop, consumers always switch on the `type` discriminator. The MUI X
DataGrid anti-pattern (30 callbacks) disappears entirely.

Trade-offs:

- One prop per component, regardless of event count.
- TypeScript narrowing is per-arm in the switch, not per-prop. Less
  ergonomic at the call site for the common "I want to handle one event"
  case.
- React DevTools shows one `onEvent` handler instead of `onDismiss` /
  `onSelect` distinctly.
- Vue's per-event idiom (`@dismiss`) loses its native form.

Rejected because the per-event ergonomic case is the dominant call-site
pattern across every React DS (Radix, Spectrum, Zag, Mantine, MUI). Pure
channel is too austere; per-event-only loses analytics integration. The
layered surface (C) costs ~10 lines of extra codegen per spec to cover both.

### Alternative — per-event props only (no `onEvent` channel)

The Radix / Zag / Mantine default. Drop `onEvent`; consumers wire each
callback they care about.

Trade-offs:

- Minimal surface; one prop per declared event.
- Analytics consumers write per-component per-event handlers (the existing
  pain).
- A future per-component telemetry helper (`onEvents({...})`) could
  partially close the gap.

Rejected because PostHog / Datadog / Segment integration is a recurring
real consumer need and a single channel reduces 15 wiring calls to 1.
Adding it costs little; not adding it leaves a hole every consumer fills.

### Alternative — embedded TypeScript strings for payload

`payload: "{ row: T; index: number }"` instead of structured per-field
declarations.

Trade-offs:

- Terse.
- Requires a TS-fragment parser; vocab validator can't check field names
  against any registry; YAML loses structural shape (everything is a string).
- Escape hatch by construction — once strings are accepted, arbitrary types
  flow through (`unknown`, `any`, third-party types).

Rejected — fails the "no escape hatches" principle.

### Alternative — adopt Zag.js as the runtime

This alternative is actually two questions in sequence; conflating them is
what made the May-24 discussion circular:

**A. Should stateful components have a real state machine at all?** Today
`interactions:` is a narrow overlay DSL (`do: open | close | toggle`).
Promoting it to a full statechart vocabulary (states, guards, actions,
context) is a substantial expansion. Whether to do that *at all* is the
first question.

**B. If yes to A, do we adopt Zag.js or hand-roll?** Only relevant after
A resolves. Zag is one path; xstate, Robot FSM, or hand-rolled are others.

**Where industry stands on A:** Radix, React Aria, Spectrum, Mantine,
Chakra UI itself — none use statecharts internally. They hand-roll with
hooks. Zag.js is the **single outlier** among major DS, and it's
structurally tied to Chakra's needs. The industry-dominant answer to A is
"no statechart; hand-roll."

**Where we stand on A:** deferred. Today only Modal and Tooltip have
`interactions:`, both with the narrow overlay vocabulary. Two data points
isn't enough to know whether a full statechart helps or over-engineers.
Revisit when 3–4 more stateful components ship and we can see which
patterns recur.

**Trade-offs for B (Zag adoption) when we get there:**

- Inherits a maintained, framework-agnostic statechart implementation;
  avoids hand-rolling.
- Bundle cost per stateful component (~1-3 kB each); not all components
  need it.
- Couples the spec layer to an external library's vocabulary; future Zag
  releases shape our codegen.

**Why this is parked, not rejected:** the events block produces the same
YAML regardless of A or B. Both "hand-roll state" and "adopt Zag" emit the
same `events:` declarations at the spec level. Decoupling means events
ships now without prejudging the state-machine question.

### Alternative — do nothing

Consumers continue reading private internals or hand-coding wrappers.
Rejected: that's the current state and the originating motivation
([#690]).

## Adoption strategy

### Migration window

Additive. No consumer-facing breaking change. No published component carries
an `events:` block yet; the schema field is optional. The first spec to
adopt is Modal (one declared event: `dismiss`) — a tracer-bullet PR that
validates the codegen end-to-end.

### Codemod

None. Two reasons: (1) there's no existing event surface to migrate from;
(2) adopting `events:` on a spec is a judgment call (which events are
worth declaring, what their payloads should be), not a mechanical
transformation.

### Default vs opt-in

`events:` is opt-in per spec. Specs with no events keep their existing
codegen output. Specs that adopt events get the per-event props + `onEvent`
channel automatically.

### Backwards compatibility

- Existing atomic specs without `events:` — unchanged.
- Existing composite specs (Modal, Tooltip) — unchanged until they adopt
  the block.
- Existing `gen-react` / `gen-vue` output for components without `events:`
  — byte-identical.
- Consumer code that wires native DOM events via attribute spread (`onClick`
  on Button) — unchanged.

### Phase ladder

The RFC ships across small PRs, each independently reviewable:

1. **Vocabulary infrastructure.** `_vocabulary.yaml` extension + generated
   TS mirror at `scripts/codegen/src/lib/vocabulary.ts`. No spec changes.
2. **Schema + validator.** `events:` and `generics:` blocks on the Zod
   schema; eight semantic-check rules. No codegen wiring yet.
3. **Codegen — single tracer-bullet spec.** Modal adopts `events: dismiss`;
   `gen-contract` + `gen-react` + `gen-vue` emit the per-event prop and
   the channel. Verifies the full pipeline on one spec.
4. **Docs four-section split.** `scripts/codegen/src/generators/gen-docs/_shared/sections.ts` rewrite;
   re-renders every existing spec into the new layout.
5. **Rollout per spec.** Tooltip, then Tabs (once events lands), then
   composite list components (#690 cluster).

## Unresolved questions

- **Should `onEvent` ship behind a separate import path (`@teseor/react/telemetry`)
  for tree-shaking, or always be present?** May-24 leans "always present"
  (one less thing for consumers to discover); the tree-shake cost of an
  always-present handler that defaults to undefined is essentially zero.
  Phase-3 implementation call; lean: always present.
- **Should the `onEvents({...})` ergonomic helper ship in this RFC or as a
  follow-up?** Per-event props already give per-event ergonomics; the helper
  is sugar on top of the channel for consumers who don't want per-event
  props at all. Defer.
- **Payload field-name vocabulary** (always-call-it `reason`, always-call-it
  `value`, etc.). This RFC enforces verb consistency but not field-name
  consistency. Defer to a follow-up vocab PR; the failure mode is mild
  (field names are read at the call site, not on every analytics line).
- **Whether the verb vocab should expose `description:` on every entry to
  the generated docs.** Probably yes — gen-docs reads vocab descriptions to
  fill the "Events" section's tooltip. Implementation detail; not a
  framing decision.
- **`data-teseor-component` / `data-teseor-action` taxonomy** (May-24 Layer 2,
  PostHog / Datadog autocapture target). Not in this RFC. Worth filing
  separately if consumers ask.
- **OpenTelemetry semantic-convention mapping** ([May-24 reference]). Out
  of scope; revisit when a consumer needs it.

## What this doesn't propose

- **Generalizing `interactions:` to a statechart.** The narrow overlay
  vocabulary (`open|close|toggle`) stays. Real machine vocabulary lives
  in a future RFC.
- **Zag.js adoption.** Parked behind the above.
- **Behavior tests derived from interactions ([#582]).** No progress this
  round; blocked on the same generalization.
- **DOM event taxonomy** (`data-teseor-*` attributes). Possible follow-up.
- **Analytics provider package** (`@teseor/{react,vue}/telemetry`). May-24
  Layer 4. Not in this RFC; the `onEvent` channel is the foundation
  it would build on.
- **Tracking-plan artifact** (Segment-compatible JSON). May-24 Layer 5.
  Possible follow-up once 5+ specs carry `events:`.
- **WebC / Svelte / Angular codegen targets.** This RFC defines the YAML
  shape; the mapping to those frameworks lands when those generators do.
- **Replacing native DOM event spread.** `onClick`, `onMouseEnter`,
  `onKeyDown` keep flowing through `Omit<…>`-based prop spread.
- **Replacing `pattern: "controllable"`.** Controllable state mirrors keep
  emitting their own callbacks; the events RFC is additive.

## Lifecycle reminder

- `draft` — opened for discussion. This PR adds the file in `draft`.
- `proposed` — design is stable; vocabulary infrastructure PR opens.
- `accepted` — the tracer-bullet spec (Modal) has merged with `events:`
  end-to-end.
- `rejected` — closed without implementation.
- `superseded` — replaced by a later RFC.

[#582]: https://github.com/teseor/teseor/issues/582
[#669]: https://github.com/teseor/teseor/issues/669
[#679]: https://github.com/teseor/teseor/issues/679
[#690]: https://github.com/teseor/teseor/issues/690
[#746]: https://github.com/teseor/teseor/issues/746
[#838]: https://github.com/teseor/teseor/issues/838
