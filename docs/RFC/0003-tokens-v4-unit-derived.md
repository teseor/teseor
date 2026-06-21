---
status: draft
proposed: 2026-05-26
decided:
---

# 0003 — tokens-v4: unit-derived spatial system

## Summary

Replace v3's hand-tabulated spatial tokens (`--t-space-*`, `--t-row-*`, `--t-text-*`, `--t-leading-*`, `--t-radius-*`, `--t-touch-min`) with formulas derived from a single CSS length, `--t-unit`. Default `--t-unit: 0.25rem` (4px @ 16px root). Every sized token is a `calc()` over `--t-unit`. Leading derives from font-size via `round(up, 1em * ratio, var(--t-unit))` instead of unitless ratios. Override `--t-unit` in any subtree → that subtree rescales coherently. The existing `--t-density` knob collapses into `--t-unit` overrides, ending its half-implementation. A new `rhythm-tokens` lint rule prevents raw px / rem from sneaking into component CSS; a follow-up runtime audit catches composition-level drift.

## Motivation

Vertical rhythm is currently a wish, not a property of the system.

- `--t-leading-normal: 1.5` (unitless ratio). Applied to `--t-text-sm: 0.89rem` (14.24px) it resolves to 21.36px — not a multiple of the 4px grid. Same at every text step except `text-base`, where `1.5 × 16px = 24px` happens to align by coincidence. The system cannot claim grid alignment because the most-used line-height token does not deliver it.
- `--t-density` only multiplies four semantic shorthands (`--t-pad-x`, `--t-pad-y`, `--t-gap`, `--t-row`). A `<Stack gap="5">` inside `[data-density="compact"]` does not get tighter; it reads `--t-space-5` directly, bypassing density. The density knob therefore lies — it makes interactive controls slightly shorter and that is it.
- There is no "rescale this region" mechanism. Bumping all sizes in a panel today means manually overriding every consumed `--t-*` token, one by one.
- Modern CSS (`round()`, `text-box-trim`, `@property`) makes vertical-rhythm derivation a single declaration. The current shape was written before these primitives reached Baseline. There is no design reason for the current shape to persist.

The investigation that produced this RFC started from #800 ("derive size/space scale from a single 4px unit via calc"). The verdict on the literal #800 proposal was: derivation in isolation is cosmetic. The real wins are adjacent — leading-on-grid and density-collapse — and they only land cleanly if the underlying system is unit-derived. This RFC packages all three.

## Detailed design

### The knob

```css
:root {
  --t-unit: 0.25rem;  /* 4px @ 16px root font. The only spatial knob. */
}
```

`--t-unit` is the only public scaling axis for the spatial system. CSS length, default `0.25rem`. Overriding it in any subtree rescales every derived token in that subtree.

### Spatial ladders (all derived)

```css
/* Spacing — curated non-linear multiplier table */
--t-space-0: 0;
--t-space-1: var(--t-unit);                  /*  4px */
--t-space-2: calc(var(--t-unit) * 2);        /*  8px */
--t-space-3: calc(var(--t-unit) * 3);        /* 12px */
--t-space-4: calc(var(--t-unit) * 4);        /* 16px */
--t-space-5: calc(var(--t-unit) * 6);        /* 24px */
--t-space-6: calc(var(--t-unit) * 8);        /* 32px */
--t-space-7: calc(var(--t-unit) * 12);       /* 48px */
--t-space-8: calc(var(--t-unit) * 16);       /* 64px */

/* Row scale */
--t-row-1: calc(var(--t-unit) * 6);          /* 24px */
--t-row-2: calc(var(--t-unit) * 8);          /* 32px */
--t-row-3: calc(var(--t-unit) * 10);         /* 40px */
--t-row-4: calc(var(--t-unit) * 12);         /* 48px */

/* Type — half-multipliers allowed for size; leading carries the rhythm */
--t-text-xs:   calc(var(--t-unit) * 3);      /* 12px */
--t-text-sm:   calc(var(--t-unit) * 3.5);    /* 14px (off-grid glyph; on-grid line-box) */
--t-text-base: calc(var(--t-unit) * 4);      /* 16px */
--t-text-lg:   calc(var(--t-unit) * 4.5);    /* 18px (off-grid glyph; on-grid line-box) */
--t-text-xl:   calc(var(--t-unit) * 5);      /* 20px */
--t-text-2xl:  calc(var(--t-unit) * 6);      /* 24px */
--t-text-3xl:  calc(var(--t-unit) * 8);      /* 32px */

/* Leading — derived from font-size, snapped up to the next unit step */
--t-leading-tight:  round(up, calc(1em * 1.25), var(--t-unit));
--t-leading-normal: round(up, calc(1em * 1.5),  var(--t-unit));

/* Radius */
--t-radius-sm: var(--t-unit);                /*  4px */
--t-radius-md: calc(var(--t-unit) * 2);      /*  8px */
--t-radius-lg: calc(var(--t-unit) * 3);      /* 12px */
--t-radius-xl: calc(var(--t-unit) * 4);      /* 16px */

/* Touch target — 44px, matches WCAG 2.5.5 (AAA Target Size Enhanced) */
--t-touch-min: calc(var(--t-unit) * 11);     /* 44px */
```

**Non-linear scale.** The multiplier table is sparse and intentional — `--t-space-5` (× 6 = 24px) skips × 5 because 20px is rarely the right gap between 16 and 24. Index numbers are labels, not multipliers; they preserve consumer ergonomics (no codemod required).

**Half-step multipliers on text-size only.** `--t-text-sm` and `--t-text-lg` resolve to 14px and 18px — off the 4px grid as glyph boxes. The line box (font-size + half-leading on each side) lands on grid because leading is unit-multiple. Skipping 14 and 18 would force the type scale to 12 / 16 / 20 / 24, eliminating the steps a modular ratio (1.125, 1.2) naturally produces in that range.

### Leading via `round()`

`round(up, value, step)` snaps any computed length up to the next multiple of `step`. Applied to natural leading:

| font-size | `1em * 1.5` | `round(up, ..., var(--t-unit))` at 4px |
| --- | --- | --- |
| 14px | 21px | **24px** |
| 16px | 24px | **24px** |
| 18px | 27px | **28px** |
| 20px | 30px | **32px** |
| 24px | 36px | **36px** |

Every rendered text line lands on the grid regardless of font size. No per-step leading aliases required.

Optional `clamp()` bound for floors / ceilings:

```css
line-height: clamp(
  calc(var(--t-unit) * 5),
  round(up, calc(1em * 1.5), var(--t-unit)),
  calc(var(--t-unit) * 8)
);
```

`round()` is Baseline 2024 — safe to ship.

### Type-on-rhythm via `text-box-trim`

```css
@supports (text-box-trim: trim-both) {
  :where(p, li, dd, blockquote) {
    text-box-trim: trim-both;
    text-box-edge: cap;
  }
}
```

`text-box-trim` removes the half-leading offset above the cap-height and below the baseline so `padding-block` produces the expected pixel gap. Without it, "rhythm" is approximate even when leading lines up. Baseline 2025; gate with `@supports`.

### Density collapse

`--t-density` and the four shorthand multiplications (`--t-pad-x = --t-space-4 * --t-density`, etc.) are removed. The `[data-density]` modifiers reassign `--t-unit` directly:

```css
:where([data-density="compact"])     { --t-unit: 0.21875rem; }  /* 3.5px */
:where([data-density="comfortable"]) { --t-unit: 0.28125rem; }  /* 4.5px */
```

The consumer API (`<section data-density="compact">`) is unchanged. The mechanism unifies.

**Behavior change**: `<Stack gap="5">` inside `[data-density="compact"]` now tightens (it reads `--t-space-5`, which now derives from `--t-unit`). Previously this had no effect.

### Local override pattern

The "few base tokens" goal is satisfied by one knob:

```css
/* Density modifier */
[data-density="compact"]  { --t-unit: 0.21875rem; }

/* Per-region rescale — "big panels in this section" */
.t-panel--prominent       { --t-unit: 0.3125rem; }

/* Device-class scaling — touch context gets bigger spacing */
@media (pointer: coarse)  { :root { --t-unit: 0.28125rem; } }

/* Pin a region to a specific grid step */
.t-island                 { --t-unit: 0.375rem; }  /* 6px */
```

All four patterns use the same mechanism. None requires touching individual rungs.

### Enforcement

Two layers — each catches what the other cannot.

**`rhythm-tokens` lint rule** (new, alongside `component-css` / `motion-scale` in `scripts/lint/file-rules/`):

- Scans `packages/css/src/components/**/*.css`.
- For sizing properties (`padding*`, `margin*`, `gap`, `block-size`, `inline-size`, `height`, `width`, `inset*`, `top`, `right`, `bottom`, `left`): values must be `0`, `auto`, `100%` / percentages, `1em` / em, `1lh` / lh, `var(--t-*)`, or `calc()` containing `var(--t-*)`. Raw px / rem outside an allowlist (`1px` / `2px` for borders) is rejected.
- In `packages/css/src/tokens.css`: every `--t-{space|row|text|leading|radius|touch}-*` declaration must trace to `var(--t-unit)` (transitively through `calc()`).

**Runtime grid audit** (follow-up, adapted from the equivalent script in legacy v2 under `scripts/`):

- Walks every docs-prod page in Playwright.
- For each non-decorative element: `height % unit < 0.01`.
- Skip-list for documented-exception components.
- Wired into CI as a post-build gate.

### Codegen + spec implications

- No spec-schema changes. `tokens:` blocks still list `--t-*` slot names; the derivation of underlying values is invisible to spec readers.
- `checkTokenFallbacks` (existing) keeps validating `fallback:` values against `tokens.css`. After the refactor every `--t-*` is `calc()`-derived; the validator already accepts `var()` / `calc()` shapes.
- `@property` for `--t-unit` can land later (gives types + animation); not required for this RFC.

### What ships in this RFC

This RFC ships in three sequential phases, each its own PR:

1. **Phase 1 (#803)** — derive all spatial tokens from `--t-unit`; add `rhythm-tokens` lint. Internal-only; no resolved value changes; no public API change.
2. **Phase 2 (#804)** — replace `--t-leading-*` with `round()`-derived form; add `text-box-trim` to body text under `@supports`. Visual diff matters; visual-regression snapshots required.
3. **Phase 3 (#805)** — collapse `--t-density` into `--t-unit` overrides. Public-API behavior change (`[data-density="compact"]` now tightens spacing rungs); Ask-before gate.

## Drawbacks

- **DevTools readout regresses.** Computed-style panels show `calc(0.25rem * 6)` for spacing, not `1.5rem`. Resolved values still display, but the raw declaration is uglier. Comment columns in source mitigate; cannot fix in DevTools.
- **Phase 3 is a behavior change.** A consumer may be deliberately relying on raw spacing rungs surviving `[data-density]`. Release-note communication, but no codemod can detect this (it is a behavior shift, not a name change).
- **Lint adds a small barrier.** Quickly writing `padding: 14px` in a component CSS file will now fail. Mitigation: clear error message naming the available `--t-space-*` rungs.
- **Half-step multipliers in the type scale are arguably a wart.** A purist single-unit system has integer multipliers only; allowing `× 3.5` and `× 4.5` is a carve-out justified by line-box (not glyph) being what carries rhythm. A different design ethic (Brutalist preset, e.g.) might reject this.
- **No support for fluid type within this RFC.** A `clamp()`-based fluid type scale is incompatible with grid-aligned leading at every viewport width (sub-pixel interpolation breaks the snap). Choosing rhythm over fluidity here is a real trade-off, not a free win.

## Alternatives

### Alternative A — keep current shape, add `round()` at component use-sites

Don't refactor `tokens.css`. Wrap every use of `--t-space-*` and `--t-row-*` in components with `round(up, ..., 4px)`.

Rejected: pushes the discipline burden onto every component author. Lint can enforce it but the cognitive cost is per-line, not per-token. Centralizing the formula in `tokens.css` makes the discipline structural.

### Alternative B — single multiplier knob (`--t-scale`) instead of `--t-unit`

Use `--t-scale` (dimensionless, default `1`) with a fixed hidden base unit. Override: `--t-scale: 0.875`.

Rejected: the dominant override mental model is "set the grid step in pixels," not "scale by N%." `--t-scale: 1.25` is shorter than `--t-unit: calc(0.25rem * 1.25)` for the "make this 25% bigger" case (a real win), but lengthier and less direct for every other case (density steps in concrete sizes, pin-to-grid for embedded widgets, device-class scaling). Single-knob `--t-unit` wins on count of natural use cases.

### Alternative C — both `--t-unit` and `--t-scale` public (legacy v2 shape)

Expose both, each handling its natural use cases (`--t-unit` for absolute, `--t-scale` for proportional).

Rejected: two knobs = two mental models + a "which wins" question when both are set in the same scope. Contradicts the "few base tokens" goal. The proportional case is rare enough that one `calc()` is acceptable.

### Alternative D — integer-only type multipliers

Drop `× 3.5` and `× 4.5`. Type scale: 12 / 12 / 16 / 20 / 24 / 32 / 40.

Rejected: collapses `text-xs` and `text-sm` (both 12), eliminates the 14 and 18 steps that modular ratios produce in the most-used range. Aesthetic loss outweighs the marginal purism gain — line-box alignment is what carries rhythm, glyph-box alignment is cosmetic.

### Alternative E — fluid type via `clamp()` between viewport breakpoints

Make text sizes interpolate smoothly across viewport widths.

Rejected for this RFC: incompatible with grid-aligned rendering at intermediate viewport widths (`round()` snapping would break the smoothness). Filed as a separate experiment worth its own RFC if the trade-off is considered acceptable.

### Alternative F — runtime audit only, no lint

Skip the new lint rule; rely on the runtime grid audit to catch drift.

Rejected: lint catches sloppy code at write-time before it ships; runtime catches emergent composition bugs that lint cannot see. They catch different bugs. Lint alone misses real rhythm violations; runtime alone misses sloppy authoring. Both are cheap relative to their value.

## Adoption strategy

### Migration window

- **Phase 1** is repo-internal. No consumer change. Ships as a non-breaking minor changeset.
- **Phase 2** changes visual output (text alignment). Pre-1.0 minor; documented in release notes with before / after screenshots. No consumer code change.
- **Phase 3** is a behavior change (`[data-density]` now affects raw spacing rungs). Pre-1.0 minor with explicit "behavior change" callout. No codemod possible — it is behavior, not naming.

### Codemod

None. Token names are unchanged in all three phases; values are derived from a knob consumers do not override today.

### Default vs opt-in

All three phases become the default immediately. There is no "opt out of unit-derivation" path — that would require maintaining two parallel systems.

### Backwards compatibility

- Every existing `var(--t-*)` reference in consumer code keeps resolving to the same value at scale 1 after Phase 1.
- After Phase 2, components that override `--t-leading-*` directly get the new derived form. Consumers reading the old aliases via `var()` get unchanged values at `text-base`; non-base text sizes shift to grid-aligned values.
- After Phase 3, `--t-density` is removed. Consumers reading `var(--t-density)` directly (none known) would break; the `[data-density]` data-attribute API is preserved.

## Unresolved questions

- **Compact density value.** Picked `0.21875rem` (3.5px) for symmetry with comfortable's `0.28125rem` (4.5px). Either could be `0.1875rem` (3px) / `0.3125rem` (5px) for 25% steps. Reviewer preference.
- **Leading carve-out scope for `text-box-trim`.** Default applied to `p, li, dd, blockquote`. Headings have their own visual story (`text-wrap: balance`); applying `text-box-trim` to them might over-tighten the leading visually. Decide during Phase 2 implementation against visual snapshots.
- **`--t-text-base` linkage to `--t-unit`.** Currently `--t-text-base: calc(var(--t-unit) * 4)` — so font scales with unit. Some consumers may prefer text-size to stay fixed when only spacing rescales. Decided yes for now (consistent single-knob), but worth revisiting if real-world feedback diverges.
- **Runtime audit attachment point.** Legacy ran against docs dev server. v3 should run against `docs-prod` build (already present in CI). Detail for the follow-up issue.

## What this doesn't propose

- **Color-system changes.** Tier 1 color tokens (60 OKLCH values) stay as-is. RFC-0002 (#751) covers single-seed derivation; this RFC is the spatial counterpart, not its color sibling.
- **Codegen / spec-schema changes.** The token-slot YAML format is unaffected.
- **`@function` or `if()` adoption.** Both are Chromium-only as of mid-2026. Watching; not adopting.
- **Fluid type.** See Alternative E.
- **Dev-mode grid overlay.** A debug visualization for verifying rhythm in the docs site is tracked separately as #807.
- **Button intent refactor.** The `--_accent` + `color-mix` cleanup for Button is tracked separately as #806; the legacy investigation surfaced both but they ship independently.
