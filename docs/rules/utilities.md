# Utility classes

Utilities are the leftovers — styling primitives that don't justify a spec file, framework wrapper, or docs page. Five categories live in `@layer utilities`:

| Category | What | Example |
| --- | --- | --- |
| **Spacing** | Padding, margin, gap × spacing scale | `.t-pad-x-4`, `.t-mar-y-2`, `.t-gap-3` |
| **Display** | Outer display values | `.t-block`, `.t-inline-flex`, `.t-grid`, `.t-none` |
| **Visibility** | Screen-reader and responsive show/hide (class-based, not data-attr) | `.t-sr-only`, `.t-hidden-md`, `.t-show-md` |
| **Text** | Single-line and multi-line truncation | `.t-truncate`, `.t-line-clamp-2` |
| **Animation** | One-shot keyframe animations | `.t-animate-fade-in`, `.t-animate-scale-in` |

Layout primitives (Stack, Cluster, Center, Sidebar) are **not utilities** — they're components with specs, wrappers, and docs pages. They live in `@layer components.styles`. Treating them as utilities loses framework integration and discoverability.

## Naming

`.t-<purpose>` for boolean utilities (`.t-truncate`, `.t-block`). `.t-<purpose>-<scale>` for scaled utilities, where `<scale>` is the numeric token suffix (`.t-pad-x-4`, `.t-gap-2`, `.t-line-clamp-3`). The scale matches the token system mechanically — `.t-pad-x-4` uses `var(--t-space-4)`, no t-shirt-size translation step.

Names match the canonical class regex (`^t-[a-z][a-z0-9]*(?:__[a-z][a-z0-9]*)*$`; see `process/ci-gates.md` § "lint"). No separate lint rule.

## Emission

Spacing and animation utilities are emitted via `postcss-each` from token lists:

```css
@each $i in 0, 1, 2, 3, 4, 5, 6, 7, 8 {
  .t-pad-x-$(i) { padding-inline: var(--t-space-$(i)); }
  .t-pad-y-$(i) { padding-block:  var(--t-space-$(i)); }
  .t-mar-x-$(i) { margin-inline:  var(--t-space-$(i)); }
  .t-mar-y-$(i) { margin-block:   var(--t-space-$(i)); }
  .t-gap-$(i)   { gap:            var(--t-space-$(i)); }
}

@each $kf in fade-in, fade-out, slide-up-in, slide-down-out, scale-in, scale-out {
  .t-animate-$(kf) {
    animation: $(kf) calc(var(--t-dur-base) * var(--t-motion-scale)) var(--t-ease-out);
  }
}
```

Display, visibility, and text utilities are hand-written in `packages/css/src/utilities/{display,visibility,text}.css`. Finite, stable, low-churn.

All five files are imported at the bottom of `teseor.css` (inside `@layer utilities`) and shipped together as `@teseor/css/utilities.css` for consumers who want utilities without components.

## Shipped artifacts

| Specifier | Contents | Use case |
| --- | --- | --- |
| `@teseor/css` | Tokens + components + utilities (everything) | Full bundle |
| `@teseor/css/utilities.css` | Utilities only | Project that doesn't use Teseor components but wants spacing/display utilities |
| `@teseor/css/<component>` | One component (with its dep closure) | Tree-shaken component import |

## Milestones

- **v0.2** (with Button): spacing + display utilities. Consumers need them immediately to lay out around Button.
- **v0.3** (with motion.css published): animation utilities (once the shared `@keyframes` from `rules/motion.md` § "Reusable keyframes" ship), text utilities, responsive visibility utilities.

## Page transitions

Page transitions are application-level, not utilities. They live as a recipe at `docs/recipes/page-transitions.md` (ships v0.5 with the recipes folder). Pattern uses the View Transitions API plus Teseor motion tokens:

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: calc(var(--t-dur-base) * var(--t-motion-scale));
  animation-timing-function: var(--t-ease-out);
}
```

Plus framework-specific `document.startViewTransition(() => /* navigate */)` patterns. Recipe documents both pieces. No component, no utility class — pure pattern.

## Sources

- `layer-order.md` (the `utilities` slot)
- `motion.md` § "Reusable keyframes" (the keyframes that `.t-animate-*` reference)
