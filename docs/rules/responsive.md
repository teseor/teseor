# Responsive design

Two distinct mechanisms, two distinct concerns:

| Mechanism | Who decides | When to use |
| --- | --- | --- |
| **Responsive props** (this doc) | Consumer, at component invocation | "This Button is `sm` on mobile, `lg` on desktop" |
| **Container queries** (component-internal) | Component author, in component CSS | "A Card reshapes when its container is narrow" |

Plus visibility utilities (`.t-hidden-md`, `.t-show-md`) for show/hide at breakpoints — see `utilities.md`.

## Decision rubric

Take these in order; stop at the first yes.

1. **Is it purely show/hide at a breakpoint?** → visibility utility (`.t-hidden-md`, `.t-show-md`; see `utilities.md`). No prop, no query.
2. **Does the right value depend on the viewport, and should each usage decide it?** → responsive prop. The consumer sets it at the call site: `size={{ base: "sm", md: "lg" }}`.
3. **Does the shape depend on the space the component is actually given?** → container query in the component's CSS. The author decides; the consumer never has to know the container width.

The split between 2 and 3 is *who owns the decision*. A responsive prop hands it to the consumer — right when the same component should look different across products. A container query keeps it with the component — right when the shape should always follow its box, so the component stays correct wherever it is dropped. When a case looks like both, default to the container query: it needs no consumer cooperation and cannot be set wrong.

## Responsive props

A prop becomes responsive by setting `responsive: true` in the spec:

```yaml
props:
  size:     { type: string, values: [sm, md, lg], default: md, responsive: true }
  loading:  { type: boolean, default: false, responsive: false }
  variant:  { type: string, values: [solid, outline, ghost, link], responsive: false }
```

**Explicit per prop.** Every non-slot prop declares `responsive:` explicitly — `true` or `false`. `validate-spec.ts` rejects omission, on the atomic root and on every composite part (`parts.<name>.props.*`). Slot props (children, `iconStart`, `iconEnd`) are exempt because they pass through content and have no breakpoint-variant rendering surface. The rule makes the decision deliberate and visible in review; a prop is never non-responsive by accident.

Two prop categories:

- **Visual props** — `size`, `density`, `layout`, `align`, `padding`. Adapting visual hierarchy across breakpoints is normal. Responsive allowed.
- **Semantic props** — `variant`, `intent`. Changing meaning at a breakpoint confuses screen readers and shifts content intent. `validate-spec.ts` rejects `responsive: true` on schema-marked semantic props.

## Shapes at a glance

Three prop value shapes carry responsive examples in the current specs: boolean, constrained string (`values:` list), and open string. The schema also accepts `type: number` with `responsive: true` — no spec uses it yet, so it's not exemplified below. Each declares the same `responsive: true`; the call-site form follows the prop's value type.

### Boolean responsive

```yaml
# spec
block: { type: boolean, default: false, responsive: true }
```

```tsx
// call site
<Button block />                              // shorthand for { base: true }
<Button block={{ base: true, md: false }} />  // full-width on mobile, content-width above
```

Canonical example: `specs/button.yaml` (`block-responsive`).

### Constrained string (enum-like)

```yaml
# spec
align: { type: string, values: [start, center, end, stretch], default: null, responsive: true }
```

```tsx
// call site
<Stack align="center" />                           // shorthand for { base: "center" }
<Stack align={{ base: "start", md: "center" }} />  // shift alignment at md
```

Canonical example: `specs/cluster.yaml` (`responsive-justify`).

### Open string

```yaml
# spec
gap: { type: string, default: null, responsive: true }
```

```tsx
// call site
<Stack gap="3" />                                // shorthand for { base: "3" }
<Stack gap={{ base: "2", md: "4", xl: "6" }} />  // tighter on mobile, looser above
```

Canonical example: `specs/stack.yaml` (`responsive-gap`).

Every form accepts `{ base, md, lg, xl, 2xl }`. Omitted breakpoints inherit from the next-narrower set value — `{ base: "2", md: "4" }` keeps `"4"` from `md` upward.

## Data-attribute rendering

Each responsive prop emits one base data-attribute plus one per breakpoint:

```html
<button class="t-button"
        data-size="sm"
        data-size-md="lg">
  Save
</button>
```

CSS, mobile-first:

```css
.t-button:where([data-size="sm"]) { … }
.t-button:where([data-size="md"]) { … }
.t-button:where([data-size="lg"]) { … }

@media (--md) {
  .t-button:where([data-size-md="sm"]) { … }
  .t-button:where([data-size-md="md"]) { … }
  .t-button:where([data-size-md="lg"]) { … }
}
@media (--lg) { /* same shape for --lg, --xl, --2xl */ }
```

The `:where()` wrapper keeps specificity flat (see `rules/hard-rules.md` rule 7). Breakpoint suffixes map to the four custom-media tokens defined in `architecture/three-tier-tokens.md` § "Breakpoints" (`--md`, `--lg`, `--xl`, `--2xl`); there is no `--sm` because base = mobile.

## Codegen behavior

For every prop marked `responsive: true`, codegen emits the full responsive selector set in the component's CSS — every breakpoint × every value. Even if no consumer of this component currently uses, say, `size-xl`, the selector is in the bundle.

| Cost | Win |
| --- | --- |
| ~200 bytes per prop per breakpoint in the per-component CSS | Bundle size is predictable from the spec, not from consumer usage |
| | Consumers add `size-xl` without redeploying Teseor |
| | `size-limit` catches if the responsive surface bloats past 4KB (per-component budget; see `process/ci-gates.md` § "bundle") |

### `coverage:` and responsive props

`coverage:` Cartesian-expands each dimension's **literal** values into test cells — it does not enumerate the responsive object form. A prop marked `responsive: true` with `values: [start, center, end]` contributes three coverage cells (one per literal), not three × five (per breakpoint). The codegen-emitted per-breakpoint selector set already covers every breakpoint × value deterministically; per-breakpoint coverage cells would duplicate that without adding signal.

To exercise the responsive object form in a contract test, add an explicit `examples:` entry that nests the object under the prop name (`props: { block: { base: true, md: false } }`) — that lands as one fixture in the generated harness and contributes one cell to the snapshot. `specs/button.yaml` (`block-responsive`) is the worked example.

## Authoring API

Single API surface — **object form only**. No `sizeMd`-style sibling props.

```tsx
// Yes
<Button size={{ base: "sm", md: "lg" }} />
<Button size="md" />   // shorthand for { base: "md" }

// No (does not exist)
<Button size="sm" sizeMd="lg" />
```

Object form scales cleanly to many breakpoints (`{ base, md, lg, xl, 2xl }`); sibling-props start clean for 2 breakpoints but clutter when all 5 are used. Shipping one API removes the per-developer preference fight, halves codegen surface, halves the docs API table, halves the type-checking surface. The TypeScript type for a responsive prop is a discriminated union of `Value | Partial<Record<Breakpoint, Value>>`.

## Container queries (internal)

When a component needs to reshape based on **its own container size** (not the viewport), use container queries inside the component's CSS:

```css
@layer components.styles {
  .t-card {
    container-type: inline-size;
  }

  @container (min-width: 30em) {
    .t-card { /* wider-card layout */ }
  }
}
```

Container queries are *component-internal*. The consumer doesn't control them; the component author decides when the shape changes. This is the right mechanism for "Card looks different in a sidebar vs in a hero." Don't reach for responsive props for this — that would force the consumer to know what container width they're rendering into.

Container queries land in components starting v0.4 (Surfaces) when reshaping becomes a real need. Not used in atomic phase.

## Visibility

Class-based utilities, not data-attributes:

- `.t-hidden-md` — hide at `@media (--md)` and above
- `.t-show-md` — show at `@media (--md)` and above (hidden below)
- `.t-sr-only` — visible to screen readers only, regardless of breakpoint

These live in `@layer utilities` (see `utilities.md`). The visibility utilities use `!important` — the documented exception in `rules/hard-rules.md` rule 6 — because they have to win against `display: flex` declared by component or layout-primitive rules at the same or higher layer.

We rejected the data-attribute form (`data-hidden-md`) because classes compose on any element naturally; data-attributes imply a namespace owned by Teseor on every element that wants to hide.

## Touch targets

Interactive component roots target ≥44px at the base (mobile) breakpoint (per `rules/accessibility.md` § "Touch targets"). Larger breakpoints can shrink for density via explicit opt-in (`data-density="compact"`), but never silently. The `--t-touch-min` token (default `2.75rem`) is the floor; responsive sizing reduces from that, never below.

## Density

`[data-density="compact"]` and `[data-density="comfortable"]` on any element reassign `--t-density` (`0.875` and `1.125`); the four spacing shorthands (`--t-pad-x`, `--t-pad-y`, `--t-gap`, `--t-row`) multiply by it. Interactive component roots that need the WCAG 2.5.5 touch-target floor read `--t-touch-min` directly — flooring `--t-row` in the token layer would inflate the default size for every consumer. No utility classes — set the attribute on a section to scope the change; no extra components react.

## Sources

- `utilities.md` § "Visibility" (the class-based visibility utilities this references)
