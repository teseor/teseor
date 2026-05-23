# ADR-0011 — CSS Anchor Positioning + Popover API for overlays

- **Status:** Accepted.
- **Deciders:** repo owner (letanure).

## Decision

Teseor's overlay components (Tooltip, Popover, future Menu / Dropdown /
ComboBox) position themselves via CSS Anchor Positioning
(`anchor-name`, `position-anchor`, `position-area`,
`position-try-fallbacks`, `anchor-size()`) and the HTML Popover API
(`popover`, `popovertarget`). No JS positioning primitive ships in
`@teseor/primitives` for v0.3. The three behavior primitives that
remain JS-only — focus-trap, portal, dismissable-layer — are unchanged.

The CSS pattern for a tooltip placed above its trigger with flip + shift
fallbacks:

```css
.t-tooltip-trigger {
  anchor-name: --t-tooltip;
}

.t-tooltip {
  position: fixed;
  position-anchor: --t-tooltip;
  position-area: top;
  margin-bottom: var(--t-space-2);
  position-try-fallbacks:
    flip-block,
    flip-block flip-inline;
}
```

The browser handles placement, flipping when the chosen side overflows,
and shifting along the cross axis. `popovertarget` on the trigger and
the `popover` attribute on the floating create an implicit anchor
association, removing the explicit `anchor-name` / `position-anchor`
pair for the standard "click trigger to open popover" case.

## Why this and not the alternatives

- **Why CSS-first.** CSS Anchor Positioning hit Baseline 2026 in
  Chrome 125+, Firefox 147+, Safari 26+ — broad enough that the JS
  primitive would duplicate browser-native behavior for ~91% of users
  on day one and shrink toward zero rationale as the long tail catches
  up. The feature fits Teseor's [`docs/architecture/css-as-source-of-truth.md`](../architecture/css-as-source-of-truth.md)
  philosophy: placement, flipping, and shifting belong in the
  component's stylesheet alongside its visual rules.
- **Why no JS fallback in v0.3.** Bundling a JS positioning library to
  cover ~9% of users doubles the surface to maintain and forces every
  Tooltip / Popover consumer to ship both paths. Older browsers
  degrade to an unpositioned overlay (or no overlay rendering, since
  the Popover API itself has similar support); this is acceptable for
  v0.3 — overlays are non-critical UI. A real consumer report can
  re-open the question.
- **Why not Floating UI.** Floating UI's middleware framework was the
  reference when [`docs/roadmap.md`](../roadmap.md) pulled
  `@teseor/primitives` forward to v0.3; the roadmap explicitly
  rejected the middleware shape. Now that CSS does the same work
  natively, even a narrow JS subset is unnecessary.
- **Why CSS-first for positioning but JS for the other three primitives.**
  focus-trap, portal, and dismissable-layer enforce behaviors CSS
  cannot express (event handling, DOM relocation, focus restoration).
  Positioning was always the outlier in the primitives set — pure
  layout math the browser is now equipped to do.

## Consequences

- **Roadmap.** [`docs/roadmap.md`](../roadmap.md) drops anchor
  positioning from the `@teseor/primitives` v0.3 list; the package
  ships with focus-trap, portal, and dismissable-layer only.
- **Components.** Tooltip and Popover (next on the v0.3 list) author
  positioning entirely in CSS. Their specs declare placement defaults
  via tokens; their stylesheets use `position-anchor` and
  `position-try-fallbacks`. No JS positioning hooks.
- **Browser support floor.** Overlays require CSS Anchor Positioning
  plus the Popover API. Documented at the component level
  ([`docs/architecture/anchor-positioning.md`](../architecture/anchor-positioning.md)).
- **Issue #654 scope.** The umbrella issue's anchor-positioning
  checkbox is retired; the three shipped primitives close it. This
  ADR is the audit trail for the de-scoping.
- **`@teseor/webc` (#584).** Web components consumers get the same
  CSS-only path automatically — the styles travel with the component.
- **Future revisit.** If a real consumer reports a need for imperative
  positioning logic that CSS cannot express (custom collision rules,
  dynamic safe-area boundaries), a JS primitive can be added as a new
  ADR without breaking the CSS-first stance.

## References

- [CSS Anchor Positioning on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning)
- [Popover API on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- [Can I Use: css-anchor-positioning](https://caniuse.com/css-anchor-positioning)
- Issues: #658 (this ADR's intake), #654 (primitives umbrella).
