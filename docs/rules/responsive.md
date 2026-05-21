# Responsive design

Two distinct mechanisms, two distinct concerns:

| Mechanism | Who decides | When to use |
| --- | --- | --- |
| **Responsive props** (this doc) | Consumer, at component invocation | "This Button is `sm` on mobile, `lg` on desktop" |
| **Container queries** (component-internal) | Component author, in component CSS | "A Card reshapes when its container is narrow" |

Plus visibility utilities (`.t-hidden-md`, `.t-show-md`) for show/hide at breakpoints — see `utilities.md`.

## Responsive props

A prop becomes responsive by setting `responsive: true` in the spec:

```yaml
props:
  size:     { type: enum, values: [sm, md, lg], default: md, responsive: true }
  loading:  { type: boolean, default: false, responsive: false }
  variant:  { type: enum, values: [solid, outline, ghost, link], responsive: false }
```

Two prop categories:

- **Visual props** — `size`, `density`, `layout`, `align`, `padding`. Adapting visual hierarchy across breakpoints is normal. Responsive allowed.
- **Semantic props** — `variant`, `intent`. Changing meaning at a breakpoint confuses screen readers and shifts content intent. `validate-spec.ts` rejects `responsive: true` on schema-marked semantic props.

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

## Sources

- `utilities.md` § "Visibility" (the class-based visibility utilities this references)
