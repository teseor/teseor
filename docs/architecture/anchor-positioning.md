# Anchor positioning

Teseor's overlay components (Tooltip, Popover, future Menu / Dropdown /
ComboBox) position themselves via **CSS Anchor Positioning** and the
**HTML Popover API**. No JS positioning library; placement, flipping,
and shifting are declared in the component's stylesheet alongside its
visual rules. Rationale: [`ADR/0011-css-anchor-positioning-for-overlays.md`](../ADR/0011-css-anchor-positioning-for-overlays.md).

## The pattern

### Anchor and floating

```css
/* trigger */
.t-tooltip-trigger {
  anchor-name: --t-tooltip;
}

/* floating */
.t-tooltip {
  position: fixed;
  position-anchor: --t-tooltip;
  position-area: top;
  margin-bottom: var(--t-space-2);
  position-try-fallbacks:
    flip-block,                /* flip top → bottom on overflow */
    flip-block flip-inline;    /* then flip cross-axis too */
}
```

`position-area` accepts one of the 3×3 region keywords (`top`, `top-start`,
`bottom-end`, etc.) — the same vocabulary the JS world calls "placements."
`position-try-fallbacks` is the declarative equivalent of Floating UI's
`flip` + `shift` middleware: the browser tries each fallback in order
until one fits or runs out.

### With the Popover API

When the trigger uses `popovertarget` and the floating uses the `popover`
attribute, the browser creates an implicit anchor association — no need
for the explicit `anchor-name` / `position-anchor` pair:

```html
<button popovertarget="t-popover-1">Open</button>
<div id="t-popover-1" popover class="t-popover">…</div>
```

```css
.t-popover {
  position-area: bottom-start;
  margin-top: var(--t-space-2);
  position-try-fallbacks: flip-block, flip-block flip-inline;
}
```

The floating is automatically in the top layer (above everything else)
and the browser handles open / close, click-outside dismissal, and Escape.
Teseor's dismissable-layer primitive overlaps with this; use the Popover
API when its built-in behavior is enough, the primitive when you need
finer control (custom dismiss conditions, stacking with non-popover
layers).

### Centering and sizing relative to the anchor

```css
.t-tooltip {
  /* Center on the anchor regardless of side */
  justify-self: anchor-center;
  /* Match the anchor's width */
  width: anchor-size(width);
  /* Or: capped to twice the anchor's width */
  max-width: calc(anchor-size(width) * 2);
}
```

## Browser support

Baseline 2026 — Chrome 125+, Firefox 147+, Safari 26+. Older browsers
ignore the anchor properties and render the floating without positioning
context (typically static at its source position). Teseor v0.3 accepts
this degradation; if a real consumer reports a need to position on
unsupported browsers, file an issue and we'll revisit
([`ADR/0011`](../ADR/0011-css-anchor-positioning-for-overlays.md)).

## What the primitives still own

CSS Anchor Positioning is placement-only. The three behavior primitives
in `@teseor/primitives` cover everything CSS cannot:

| Concern | Source |
| --- | --- |
| Confine Tab/Shift+Tab inside the open overlay | `@teseor/primitives` → `focus-trap` |
| Render the overlay outside its parent's stacking / overflow context | Popover API top layer, or `@teseor/primitives` → `portal` |
| Close on Escape + click-outside with stack-aware cascade | Popover API for the simple case, `@teseor/primitives` → `dismissable-layer` for nested overlays or non-popover layers |
| Place the overlay relative to a trigger with flip + shift | **CSS Anchor Positioning + Popover API** (this document) |

## Sources

- [CSS Anchor Positioning on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning)
- [Using CSS Anchor Positioning on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning/Using)
- [Popover API on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- [Can I Use: css-anchor-positioning](https://caniuse.com/css-anchor-positioning)
