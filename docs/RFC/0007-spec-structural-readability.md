---
status: draft
proposed: 2026-06-01
decided:
---

# 0007 — spec: structural readability + per-part state model

## Summary

Move the wiring that connects a composite spec's parts — overlay geometry,
state transitions, event emissions — out of three independent root-level
blocks (`overlay:`, `interactions:`, root `events:` for emit targets) and
onto the part that owns the behavior. Each composite part may declare a
`states:` map; the first declared state is initial; transitions carry the
`{ to, after, emits }` shape. Event sources use prefix syntax
(`<partName>.<dom-event>`, `key.<keyname>`, `outside.<event>`,
`timer.<propName>`). The root `events:` block survives as the consumer-
surface declaration (`<Name>Event` union, descriptions, payload types);
per-state `emits:` references those declarations. The root `interactions:`
block dies. Atomic specs are unchanged. No retro-compat — the four current
composite specs (`modal`, `tooltip`, `pagination`, `tablist`) rewrite in
one PR.

## Motivation

The spec format scatters one logical concept across three blocks joined
only by string-key matching. In `specs/modal.yaml` today, the part name
`trigger` appears in three places — `overlay.anchor: trigger`,
`interactions[].on.target: trigger`, `parts.trigger` — and a reader has
to do the match in their head to see "the trigger button opens the
content dialog and the content dismisses via outside / escape / button."
Same scatter in `specs/tooltip.yaml`: `trigger` named in four
`interactions:` rules plus `overlay.anchor` plus `parts.trigger`.

The cost shows up at every author touch:

- **Authoring a new composite means hand-syncing names across blocks.**
  PR review repeatedly catches typos (`tigger`), missing rules (forgot
  the `focusin` companion to `pointerenter`), and rules that point at
  a non-existent part. The spec format gives no structural cue.
- **Adding a new stateful component compounds the scatter.** A
  Combobox spec under today's format needs entries in `overlay:` (anchor
  / floating / mode), `interactions:` (open on input.focus, close on
  blur, navigate on arrow keys, commit on enter, dismiss on escape),
  and root `events:` (select). That's three blocks growing in lockstep
  by string-key match.
- **The state model has no place to live.** Today's `interactions:`
  vocabulary is a flat list of `{ on, target, do, delay? }` rules — no
  notion of states, no transitions, no entry/exit. Tooltip's open/close
  pair with delays works only because the underlying `useOverlay`
  runtime hardcodes a two-state machine and reads `delayMs` from the
  rule. Anything more complex (Combobox's idle/open/highlighted, form-
  field's idle/focused/error) can't be expressed.
- **The `interactions:` generalization deferral** in the RFC-0006 cycle
  (and the related Zag-vs-hand-roll decision) has now blocked gen-vue
  parity (step 3c) and every composite past Modal. The audit
  (`docs/research/spec-format-complexity-audit.md`) showed the
  validator's atomic-vs-composite duplication is solvable by a shared
  visitor (P1), but the wiring scatter the audit did *not* address is
  the bigger pain.

## Detailed design

### The new shape — `modal.yaml` after the RFC

```yaml
name: modal
description: A modal overlay that traps focus and inerts the page until dismissed.
kind: composite
cssFile: components/modal/modal.css

events:
  dismiss:
    description: "Fired when the dialog closes."
    payload:
      reason: { type: enum, values: [outside, escape, button] }

parts:
  trigger:
    fromChildren: true
    rootClass: t-modal-trigger
    props:
      open:
        type: boolean
        pattern: controllable
        responsive: false
        description: "Open state. Uncontrolled by default; pass `open` and optionally `onOpenChange` to drive it."

  content:
    element: div
    rootClass: t-modal
    a11y: { role: dialog }
    overlay: { anchor: trigger, modal: true, anchorVar: --t-modal-anchor }
    states:
      closed:
        on:
          trigger.click: open
      open:
        on:
          trigger.click:   { to: closed, emits: { dismiss: { reason: button  } } }
          key.escape:      { to: closed, emits: { dismiss: { reason: escape  } } }
          outside.click:   { to: closed, emits: { dismiss: { reason: outside } } }
    props:
      title:
        type: string
        slot: true
        description: "Modal body text."
    tokens:
      bg:     { fallback: --t-bg,    desc: Background fill. }
      fg:     { fallback: --t-on-bg, desc: Text color. }
      pad:    { fallback: --t-space-5, desc: Inner padding. }
      radius: { fallback: --t-radius-md, desc: Corner radius. }
    privateTokens: [--_bg, --_fg, --_pad, --_radius, --_anchor]

examples:
  - id: default
    props: { title: "Are you sure?" }
```

The name `trigger` appears in exactly two places: where it's defined
(`parts.trigger`) and where it's referenced by `content.overlay.anchor`
and the `trigger.click` transition source. The state model is colocated
with the part it describes (`content`, the overlay floating element).
The `interactions:` block is gone; the `overlay:` block moves onto
`content`.

### Schema changes

The recursive `componentPart` gains:

```ts
const transitionTarget = z.union([
  z.string().min(1),                          // shorthand: target state name
  z.strictObject({
    to:    z.string().min(1),                 // destination state
    after: z.string().min(1).optional(),      // delay sourced from same-part prop
    when:  z.string().min(1).optional(),      // guard: boolean expression
    emits: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
    // emits: { <eventName>: { <payloadField>: <literal> } }
  }),
]);

const stateDef = z.strictObject({
  on: z.record(z.string(), transitionTarget).default({}),
});

const componentPart = z.strictObject({
  // existing fields: element, rootClass, fromChildren, repeating, propName,
  // groupKey, props, tokens, states (was missing), privateTokens, a11y,
  // motion, variants, intents, sizes, constraints, parts.
  // new fields:
  states:  z.record(z.string(), stateDef).optional(),
  overlay: overlayBlock.optional(),  // moved from root
});
```

Root-level changes to the discriminated union:

- `overlay:` removed from `identityFields` (now part-only).
- `interactions:` removed from `identityFields` (replaced by per-part
  `states:`).
- `events:` stays at root — declares the consumer surface. `emits:`
  values inside transitions must reference event names declared here.
- `behavior:` removed (orphaned field; flagged in the audit).

### Event-source prefix syntax

A transition source key is one of:

| Prefix | Shape | Example | Validates |
| --- | --- | --- | --- |
| Part DOM event | `<partName>.<eventName>` | `trigger.click` | `<partName>` must be a declared sibling part of the current part's parent; `<eventName>` is a DOM event in the registered vocabulary (see below). |
| Global key | `key.<name>` | `key.escape` | `<name>` from a registered key vocabulary (`escape`, `enter`, `tab`, `space`, `arrowUp`, `arrowDown`, `arrowLeft`, `arrowRight`, `home`, `end`). |
| Outside | `outside.<eventName>` | `outside.click` | Permitted only when the part declares `overlay:` (semantic-check: `outside.*` source on a non-overlay part rejected). |
| Timer | `timer.<fieldName>` | `timer.openDelay` | `<fieldName>` must be a `type: number` prop on the same part. |

DOM event names live in `specs/_vocabulary.yaml` under a new
`dom_events:` block:

```yaml
dom_events:
  - click
  - pointerenter
  - pointerleave
  - focusin
  - focusout
  - input
  - change
  - submit
```

Misspellings (`focusIn`, `clik`) are rejected with Levenshtein
suggestions, same machinery as event-name verbs.

### Transition shorthand

`trigger.click: open` is sugar for `trigger.click: { to: open }`. The
shorthand is rejected when the transition needs `after:` or `emits:`.

`after:` is a string referencing a same-part numeric prop. Resolution
is runtime-side: the generated wrapper reads the current prop value,
schedules `setTimeout(transition, value)`. Cancellation on competing
events is handled by the generated state-machine runtime.

`emits:` is a map of `<eventName>: { <payloadField>: <literal> }`.
Literals are validated against the root `events:` declaration (an enum
value must be in the declared `values:` set; a `type: string` field
accepts any string literal). Generic / builtin payload fields cannot
carry literals — they're consumer-supplied — and the validator rejects
`emits:` for those.

`when:` is a guard — a boolean expression that decides whether the
transition fires. The expression vocabulary is intentionally small to
keep the spec from drifting into general-purpose code:

- `<partName>.<boolean-prop>` — true when the named sibling part's
  declared boolean prop is true.
- `!<expression>` — negation.

That's it. No `&&` / `||` / parens; if a real case needs them, a
follow-up RFC adds the syntax. The expression is parsed at validation
time; resolution at runtime reads the responsive prop value at the
active breakpoint (the same machinery `useOverlay` uses today for the
hardcoded `disabled` check). Tooltip's spec illustrates:

```yaml
parts:
  trigger:
    fromChildren: true
    props:
      disabled:
        type: boolean
        default: false
        responsive: true
        description: "Suppresses the tooltip; responsive so it can be hidden at narrow viewports."
      openDelay:  { type: number, default: 300 }
      closeDelay: { type: number, default: 0   }
  content:
    element: div
    overlay: { anchor: trigger, anchorVar: --t-tooltip-anchor }
    states:
      closed:
        on:
          trigger.pointerenter: { to: open, after: openDelay, when: '!trigger.disabled' }
          trigger.focusin:      { to: open,                    when: '!trigger.disabled' }
      open:
        on:
          trigger.pointerleave: { to: closed, after: closeDelay }
          trigger.focusout:     { to: closed }
```

The `when: '!trigger.disabled'` guard replaces the hardcoded
`Object.hasOwn(spec.props, "disabled")` special case in
gen-react/kinds/composite-overlay.ts:127 (flagged as accidental in
`docs/research/spec-format-complexity-audit.md`).

### Side effects stay implicit

The RFC does *not* introduce an `effects:` or `actions:` block. Side
effects derive from existing declarations:

- `overlay.modal: true` → focus trap on `open` state, scroll lock on
  body, portal mount.
- `overlay.modal` absent → no trap, no lock, anchored positioning via
  `useOverlay`.
- `a11y.role: dialog` → ARIA wiring.

New effects join the vocabulary on a per-need basis (the same governance
as the rest of the spec format). Zag's `actions:` / `guards:` /
`context:` machinery is explicitly not adopted; see Alternatives.

### DOM nesting rule

Spec nesting follows the wrapper's rendered output:

- DOM-sibling roots (the two halves of an overlay rendered via portal:
  `modal`, `tooltip`) → flat `parts:` map.
- DOM-nested elements → nested `parts:` map on the parent.

Examples:

- `tablist` future-Tabs: `parts.tablist.parts.tab` (tab nests inside
  tablist).
- `DataTable`: `parts.table.parts.header.parts.cell`,
  `parts.table.parts.body.parts.row.parts.cell`.
- `Form-field` composition (future kind): siblings, flat parts.

The rule is mechanical. The wrapper's rendered template is the
authority; when in doubt, look at the generated React/Vue output.

### Validator additions

New semantic-check rules:

1. **States need an initial.** First key in a part's `states:` map is
   initial. Empty `states:` rejected (use no `states:` at all instead).
2. **State references resolve.** Every `to:` target must be a key in
   the same part's `states:` map.
3. **Source prefixes resolve.** `<partName>.<event>` — `<partName>` must
   be a sibling part of the current part's parent. `key.<name>` must
   match the key vocabulary. `outside.<event>` requires the current part
   to declare `overlay:`. `timer.<prop>` requires a `type: number` prop
   on the same part.
4. **DOM event names are vocab-checked.** Same machinery as event-verb
   vocab; misspellings get Levenshtein suggestions.
5. **`emits:` event names exist.** Every `<eventName>` in `emits:` must
   be a key in root `events:`. Payload literals validated against the
   declared payload shape.
6. **`overlay:` declares one anchor part.** `anchor:` must be a sibling
   part name. The anchored part must declare `fromChildren: true`.
7. **`outside.*` sources only on overlay parts.** Catches the source-
   misuse case directly.
8. **At least one transition fires `emits:` for every declared root
   event.** Otherwise the event is unreachable; warn (don't reject —
   useful as scaffolding).
9. **`pattern: "controllable"` props mirror a state name.** When a part
   declares `states:` *and* a controllable boolean (`open`), the prop
   name must match a state pair (`open` / `closed`). Codegen wires the
   prop to the runtime's initial state.
10. **Guard expressions parse and resolve.** `when:` expressions must
    match the supported grammar (`<part>.<boolean-prop>` with optional
    `!` negation), `<part>` must be a sibling of the current part, and
    `<boolean-prop>` must be a `type: boolean` prop on that part.

The audit's P1 (shared visitor for atomic-vs-composite walks) is
*superseded* by this RFC's reshape of the validator — the new rules
walk the parts tree differently, and the duplication the visitor was
solving disappears as a byproduct.

### Generator implications

- **`gen-contract`**: per-part `<Name>State` union added next to the
  existing `<Name>Event` union, generated from the keys of each part's
  `states:` map. `<Name>Props` is unchanged in shape (controllable
  triple still expands; `on<Event>` props still emit from root
  `events:`).
- **`gen-react` / `gen-vue`**: today's `useOverlay` composable is
  replaced by a `useStateMachine(spec.states, initial, dispatch)` hook
  generated per part that owns a `states:` block. The hook lives in
  `@teseor/primitives` and is ~150 LOC, shared by React and Vue
  (framework adapters thin). Transitions emit imperative
  `setTimeout` / `clearTimeout` for `after:` delays. Portal mount and
  focus trap remain in the existing `useOverlay` helpers, conditioned
  on `overlay.modal: true`.
- **`gen-docs`**: per-part state diagram (Mermaid) generated from
  `states:` — emitted in the State section of the new four-section
  layout (Configuration / Content / State / Events) from RFC-0006,
  which lands as part of this RFC's surface. Keyboard-row table
  derives automatically from `key.<name>` transitions. Guard
  expressions surface as a "Conditions" sub-table in the State
  section.
- **`gen-tests`**: state-transition smoke tests can be generated per
  part — for each transition source, fire the event in a test renderer,
  assert the state changes. Out of scope for this RFC; tracked.

## Drawbacks

- **One-shot rewrite of every composite spec.** Four specs today; ~10
  more in the planned roadmap before stable. The window for the rewrite
  is now (pre-release, no consumers); the cost compounds with every
  composite that lands first.
- **The validator grows.** Nine new rules + the source-prefix vocab.
  Net LOC in `semantic-checks.ts` may go *up* (new structural rules) even
  though the cross-block name-matching disappears. The win is on the
  *spec* side, not the validator.
- **A state-machine runtime now lives in `@teseor/primitives`.** ~150
  LOC of new shared code; both React and Vue framework adapters thin on
  top. Adds a primitive that consumers can't easily replace.
- **The `pattern: "controllable"` ↔ state-name coupling** (rule 9) is a
  new constraint. It feels right for overlays (`open` prop ↔ `open` /
  `closed` state pair) but may be awkward for components where the
  controllable prop and the state name don't naturally align. Mitigated
  by the rule being a check, not a requirement — components without
  a controllable prop work fine.

## Alternatives

### A — Wiring on parts, no state model

A lighter version of this RFC: `parts.trigger.onClick: toggle`,
`parts.content.onDismiss: [outside, escape, button]`. Solves modal.yaml
readability. Falls apart for tooltip — open/close delay pair with
pointerenter/pointerleave AND focusin/focusout has no structural place,
forcing ad-hoc fields per component. Rejected: the deferral the project
has been carrying (`interactions:` generalization, Zag-vs-hand-roll) is
the same conversation; punting on the state model now means revisiting
the wiring shape a second time when Combobox lands.

### B — Full Zag.js adoption

Adopt Zag's machine config as the spec shape. `machine: { initial,
context, states: { … } }` at root, parts as a separate `parts:` block.
Rejected: Zag's config shape *re-creates* the cross-block name-matching
problem this RFC exists to solve — the state model and the parts live in
separate blocks and the names join by string-key. Adopting Zag's
concepts (states, transitions, emitted events) is what makes specs
readable; adopting its config shape is not. Industry note (handover
context): Radix, Spectrum, Aria, Mantine, Chakra all hand-roll; Zag is
the single outlier.

### C — Do nothing

Land the audit's P1 (shared visitor) only and live with the cross-block
scatter. Rejected: the audit explicitly named cross-block name-matching
as out of scope; the user has identified it as the load-bearing
readability pain. P1 fixes validator duplication, not the spec author's
experience.

### D — `actions:` / `guards:` / `context:` Zag-style machinery

Add explicit action and guard fields to transitions. Rejected: no current
or planned spec has a real guarded transition (every condition is "is
this prop true?", which a Tooltip-style `disabled` check can express
inline). Speculative complexity; revisit when a real guard appears.

## Adoption

No retro-compat. The project is pre-release; the rewrite happens in one
PR. The four current composite specs (`modal`, `tooltip`, `pagination`,
`tablist`) move to the new shape together with the schema, validator,
runtime, and generator changes — single coordinated change, single
generated-output regen.

Scope of the rewrite PR:

- Schema: drop root `overlay:` / `interactions:`; add `componentPart.states`,
  `componentPart.overlay`, transition `when:` field.
- Validator: ten new rules (state references, source prefixes, guard
  expressions, `emits:` resolution, overlay anchor declaration, etc.);
  remove the rules that policed the old root blocks.
- Runtime: new `useStateMachine` primitive in `@teseor/primitives`
  (~150 LOC, framework-agnostic core; React and Vue adapters thin).
  Today's `useOverlay` continues to handle focus trap / scroll lock /
  portal mount, driven by `overlay.modal: true`.
- Generators: per-part `<Name>State` union (`gen-contract`); state-machine
  hook wiring (`gen-react`, `gen-vue`); state diagram + four-section
  docs split + guard table (`gen-docs`).
- Specs: rewrite `modal`, `tooltip`, `pagination`, `tablist` to the new
  shape. `pagination` and `tablist` have no states; the rewrite is just
  removing root `behavior:` and (for tablist) shape verification.

Out-of-band cleanups inside the rewrite (the audit's "defer
opportunistically" list applies here):

- Remove the `behavior:` field (schema + identityFields).
- Remove the dead `events:` / `generics:` carry-through on atomic
  FlatSpec.
- Update `docs/architecture/codegen-pipeline.md`.

Documentation:

- `docs/ADR/0009-spec-schema-and-validation.md` — gets a new ADR
  superseding the relevant sections (root-only fields, the `overlay:`
  block placement). Per ADR-0005, RFC-0007 doesn't supersede 0009
  directly; the load-bearing decisions in the RFC each get a new ADR
  (one for "states live on parts," one for "event sources use prefix
  syntax," one for "the wiring runtime lives in `@teseor/primitives`").

## Unresolved questions

- **State diagram rendering format.** Mermaid is the in-scope choice
  (lands in this RFC's `gen-docs` change). Open question is whether to
  also emit a typed transition table next to it — defer until the
  four-section docs split exists and the visual is reviewable.
- **Per-spec generated transition tests.** `gen-tests` could emit one
  test per transition automatically. Useful but not load-bearing; the
  state-machine runtime is small enough to test directly. Tracked as a
  follow-up.
- **`emits:` on state entry vs only on transitions.** Today the design
  fires `emits:` only on transitions. An entry-fired emit (e.g. "every
  time we enter `open`, fire `opened`") might be useful for analytics;
  not blocking. Revisit when a real case appears.
- **Tracking-plan artifact** (Segment-compatible JSON emitted from root
  `events:`). Pure `gen-docs` side; doesn't affect the spec format. Ships
  as a follow-up PR after the core RFC lands; not in this RFC's surface.
- **Animation-aware transition states.** First-classing the name
  `closing` would bake timing assumptions into the runtime (when does
  `closing` complete?). Authors can already model exit animations under
  this RFC: `states.closing.on.animationEnd: closed`. No special-casing.

Out of scope for RFC-0007 (each gets its own RFC if pursued):

- **Form composition as a separate kind** — sibling-wired children with
  `for` / `aria-describedby` (the Field kind anticipated in
  `docs/ADR/0009-spec-schema-and-validation.md`). Different conceptual
  area (id-references, not state machines). Needs its own design pass.
- **Guard expression grammar extensions** (`&&`, `||`, parens). Add
  when a real spec needs them. The minimal `<part>.<prop>` + `!`
  vocabulary handles every current and planned composite.
- **`actions:` / `context:` Zag-style machinery.** Rejected in
  Alternatives; revisit only when a side-effect-on-transition or
  internal-machine-state case appears that can't be expressed via
  existing fields (`emits:` for side effects, prop values for state).

## References

- `docs/research/spec-format-complexity-audit.md` — the audit that
  framed the wiring scatter as the load-bearing pain. P1 (shared
  visitor) is superseded by this RFC.
- `docs/ADR/0009-spec-schema-and-validation.md` — the existing
  schema-and-validation ADR; root-only / part-only placement rules get
  superseding ADRs as part of this RFC's adoption.
- `docs/RFC/0006-events.md` — the root `events:` block this RFC
  preserves (declaration shape unchanged; emit wiring moves to per-state
  `emits:`).
- `specs/_vocabulary.yaml` — the verb and synonym registry; this RFC
  adds `dom_events:` + a key vocabulary alongside.
- Project-internal: the `interactions:` statechart generalization and
  Zag-vs-hand-roll deferrals (handover) are decided here.
