# Motion

Motion is token-driven, scale-gated, and lint-bounded. The rules below are enforced by Stylelint + spec validator where possible, by code review where not.

## Token surface

See `architecture/three-tier-tokens.md` for the full token table. The motion-relevant tokens are:

- **Durations.** `--t-dur-instant` (0), `--t-dur-fast` (120ms), `--t-dur-base` (200ms), `--t-dur-slow` (320ms), `--t-dur-glacial` (500ms).
- **Paired enter/exit durations.** `--t-dur-enter-*` are aliases of the base durations. `--t-dur-exit-*` are 65% of their enter counterparts. Components reference these when motion is directional; `--t-dur-base` when motion is symmetric (hover, color shifts).
- **Easings.** `--t-ease-standard`, `--t-ease-out`, `--t-ease-in`, `--t-ease-spring`, `--t-ease-linear`.
- **Motion scale.** `--t-motion-scale`, normally 1, set to 0 inside `@media (prefers-reduced-motion: reduce)` in `tokens.css`.

## Five rules

**1. Every transition multiplies by `var(--t-motion-scale)`.** The duration in `transition: <prop> <dur> <ease>` is `calc(var(--t-dur-*) * var(--t-motion-scale))`, never the bare token. Stylelint rejects bare durations on `transition` and `transition-duration`. This is *the* reduced-motion mechanism — without it, the kill switch doesn't work.

**2. Exits are 65% of enters.** When a component animates directional motion (modal open/close, drawer slide-in/out, popover show/hide), the exit duration uses `--t-dur-exit-*` and the enter uses `--t-dur-enter-*`. Symmetric motion (hover, focus, color shifts) uses `--t-dur-base` for both. The 65% ratio is encoded in the paired tokens so component authors don't do math.

**3. `--t-ease-spring` is reserved for macro motion.** Drawer open, modal scale-in, large translate animations — fine. Hover color shift, focus ring fade-in, button press — not fine. Bouncy easing on micro-interactions feels twitchy. Enforced by review, not lint (the boundary is contextual).

**4. Only transform-equivalent properties are transitionable.** The allowed list: `transform`, `opacity`, `filter`, `background-color`, `color`, `border-color`, `box-shadow`, `outline-color`. Properties that affect layout (`width`, `height`, `block-size`, `inline-size`, `padding`, `margin`, `top`, `left`, …) cause reflows; transitioning them is banned at the lint layer. Stylelint's `declaration-property-value-allowed-list` enforces.

**5. In/out symmetry.** A component spec that declares `motion.enters: [open]` MUST also declare `motion.exits: [close]`. The validator (`validate-spec.ts`) rejects asymmetric declarations. Symmetry of *existence*, not of *duration* — rule 2 already says exits are faster.

## Reusable keyframes

Shared `@keyframes` live in `packages/css/src/motion.css`:

```css
@keyframes fade-in   { from { opacity: 0; } to   { opacity: 1; } }
@keyframes fade-out  { from { opacity: 1; } to   { opacity: 0; } }
@keyframes slide-up-in    { from { transform: translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes slide-down-out { from { transform: none; opacity: 1; } to { transform: translateY(8px); opacity: 0; } }
@keyframes scale-in   { from { transform: scale(0.95); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes scale-out  { from { transform: none; opacity: 1; } to { transform: scale(0.95); opacity: 0; } }
@keyframes spin       { to { transform: rotate(1turn); } }
```

No `@layer` wrapper — keyframes are identified by name in a global namespace, not by selectors entering the cascade (we settled this in C).

**Reduced-motion variants** live in the same file:

```css
@media (prefers-reduced-motion: reduce) {
  @keyframes fade-in       { to { opacity: 1; } }   /* immediate jump */
  @keyframes slide-up-in   { to { transform: none; opacity: 1; } }
  @keyframes scale-in      { to { transform: none; opacity: 1; } }
  /* …no spin variant: continuous motion is killed by --t-motion-scale: 0 inside transition durations… */
}
```

Components reference keyframes by name and multiply duration through `--t-motion-scale`:

```css
.t-modal[data-state="open"] {
  animation: scale-in calc(var(--t-dur-enter-base) * var(--t-motion-scale)) var(--t-ease-out);
}
```

## Spec field

`motion:` is required at v0.2 for every component:

```yaml
motion:
  transitions: [background-color, transform]      # symmetric — both enters and exits use these properties
  enters: [open]                                  # named transitions (optional)
  exits: [close]                                  # required if `enters:` is set
```

`gen-tests` emits a motion test per `enters`/`exits` entry: verifies the duration token used matches the paired enter/exit pattern. `gen-docs` surfaces the motion summary on the docs page.

## No breakpoint-based duration scaling

Animations run at the same duration across breakpoints. Speed-scaling-by-screen-size is polish that most users don't perceive; baking it into the system multiplies token surface for marginal gain. Apps that have a documented need override `--t-motion-scale` per breakpoint in their own theme — we don't ship the axis.

## Page transitions

Page transitions are application-level concerns, not components. They're documented as a recipe at `docs/recipes/page-transitions.md` (lands v0.5 with recipes) using the View Transitions API plus Teseor's `--t-dur-*` / `--t-ease-*` tokens. Recipe-only. No utility class, no component, no wrapper.

## Sources

- `three-tier-tokens.md` § "Motion" (token surface)
- `accessibility.md` § "Reduced motion" (a11y enforcement)
