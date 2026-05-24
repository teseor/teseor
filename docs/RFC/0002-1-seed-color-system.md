---
status: draft
proposed: 2026-05-24
decided:
---

# `0002` — `1-seed color system + vibe presets`

## Summary

Reduce the consumer-facing color-theming surface from ~60 OKLCH ramp
values to **one seed (hue + chroma) plus one vibe selector**. A build-time
derivation step emits the full Tier-1 scale (`--t-neutral-*`,
`--t-accent-*`, `--t-success-*`, `--t-warning-*`, `--t-danger-*`,
`--t-info-*`, light and dark) from the seed. The vibe selector
(`default`, `natural`, `brutalist`, `terminal`) changes derivation
*rules* — chroma multipliers, neutral hue tinting, ramp shape — not the
values themselves. Existing hand-authored Tier-1 themes keep working
(opt-in via setting `--t-seed-hue`, otherwise no behavior change).

## Motivation

`packages/css/src/tokens.css` ships six hue families (neutral, accent,
success, warning, danger, info) at 50–900 granularity — roughly sixty
OKLCH values consumers must override to fully retheme. The themes
architecture (`docs/architecture/themes.md`) covers the *file shape* of a
theme but offers no path between "override two semantic aliases" and
"hand-author all sixty Tier-1 ramps". Three concrete failure modes follow
from this gap:

1. **No starter palette.** A consumer who wants "give me a nice
   teal-flavored Teseor" has no entry point. The planned v1.0 theme pair
   (`default` + `editorial`) is a pair, not a palette system.

2. **Brand-vs-accent collision is unguarded.** Companies whose brand
   color falls in an intent hue zone (red ≈25°, amber ≈80°, green ≈155°,
   cyan ≈210°) currently have nothing stopping them from setting
   `--t-accent` to that hue, making their primary CTA visually
   indistinguishable from a Danger / Warning / Success / Info button.
   No `--t-brand` separate from `--t-accent` exists today.

3. **No path to a docs picker.** A `teseor.dev/themes` interactive
   picker is implied but unbacked. A picker over 60 values is unusable;
   a picker over 2 + a radio is. Without this token shape, the picker
   cannot ship.

A softer fourth reason: Tailwind/Material color docs become unlabeled
swatch walls. Radix solved this by labeling each step by purpose. The
1-seed surface gives the docs page a way to lead with the ten semantic
aliases consumers actually read (`--t-fg`, `--t-bg`, `--t-accent`, …)
and treat the raw 50–900 scale as reference, behind a toggle.

The issue that motivated this RFC is [#750][issue-750].

## Detailed design

### The seed surface

Three new Tier-2 declarations at `:root`:

```css
:root {
  --t-seed-hue: 268;         /* OKLCH hue, 0-360 */
  --t-seed-chroma: 0.20;     /* OKLCH chroma at the accent anchor step */
  --t-vibe: default;         /* default | natural | brutalist | terminal */
}
```

`--t-vibe` is an *identifier* — it's read by the build-time derivation
plugin, not by CSS at runtime. The plugin substitutes it during the
build; runtime CSS never branches on `--t-vibe`. The token is declared
at `:root` so a theme file (`themes/editorial.css`) or consumer
`theme.css` can override it.

### Derivation algorithm

A new PostCSS plugin (`@teseor/postcss-derive-colors`) runs *before*
`postcss-import` bundles `teseor.css`. It reads `--t-seed-hue`,
`--t-seed-chroma`, and `--t-vibe` from `tokens.css` and emits Tier-1
ramps as the first `@layer tokens.scale` block of the file. If a
consumer's `theme.css` has already declared `--t-neutral-50` (or any
other Tier-1 token), the derivation skips that token — hand-authored
values always win.

Per ramp, the lightness curve is fixed and matches today's
`tokens.css`. The chroma curve depends on the vibe; the hue depends on
the family and the vibe.

**Lightness ladder** (identical to today's `tokens.css`):

| Step | L (accent / intents) | L (neutral) |
|---|---|---|
| 50 | 0.97 | 0.97 (= neutral-10) |
| 100 | 0.93 | 0.92 (= neutral-20) |
| 200 | 0.86 | 0.85 (= neutral-30) |
| 300 | 0.78 | 0.75 (= neutral-40) |
| 400 | 0.71 | 0.65 (= neutral-50) |
| 500 | 0.58 (anchor) | 0.55 (= neutral-60) |
| 600 | 0.48 | 0.42 (= neutral-70) |
| 700 | 0.40 | 0.30 (= neutral-80) |
| 800 | 0.32 | 0.18 (= neutral-90) |
| 900 | 0.24 | 0.00 (= neutral-100) |

Step 500 of the accent ramp drops from today's 0.65 to 0.58 to lift
APCA contrast against white text past Lc 60 with margin (today's value
sits near the floor).

**Chroma curve** — a half-cosine peaking at step 500, scaled by the
vibe multiplier `Mc` (see § Vibe multipliers below):

```
chroma(step) = seedChroma * Mc * cosineEasing(step)
```

where `cosineEasing` is `1.0` at step 500, `0.11` at step 50, `0.55`
at step 900. This matches the chroma shape of today's accent ramp.

**Hue per family**:

| Family | Hue (fixed, vibe-independent) |
|---|---|
| accent | `--t-seed-hue` |
| success | 155° |
| warning | 80° |
| danger | 25° |
| info | 210° |
| neutral | depends on vibe (§ Vibe rules) |

Intent hues are intentionally not derived from the accent. A
green-leaning accent must not pull "danger" away from red — universal
intent recognition trumps palette harmony.

### Vibe rules

| Vibe | Accent chroma Mc | Intent chroma Mc | Neutral hue tint | Neutral chroma | Ramp shape |
|---|---|---|---|---|---|
| `default` | 1.0 | 1.0 | 0 (pure gray) | 0 | smooth |
| `natural` | 0.65 | 0.70 | `--t-seed-hue` | 0.008 (subtle warm-tint) | smooth |
| `brutalist` | 1.0 | 1.0 | 0 (pure gray) | 0 | flattened — see below |
| `terminal` | 1.0 | 0 → recolored | `--t-seed-hue` | 0.015 | dark-biased — see below |

**`brutalist` ramp shape.** The neutral ramp collapses its midtones:
neutral-30 through neutral-70 are pulled toward 0 or 100 (high-contrast,
flat) rather than spread smoothly. Concretely, neutral-50 is forced to
L=0.50 with zero blur, and the 30/40/60/70 steps quantize to 0.85, 0.65,
0.30, 0.10 instead of the smooth ladder. Accent and intents keep their
smooth ramps — only the neutral surface flattens. This produces the
high-contrast / no-fog feel without sacrificing accent legibility.

**`terminal` ramp shape.** The lightness ladder inverts emphasis: the
ramp is dark-biased, with step 500 of the accent at L=0.70 instead of
0.58 (because terminal-style accents read on dark backgrounds, where
higher L lifts better). Intent ramps are *recolored* into the accent
hue family — `--t-danger-500` becomes `oklch(0.55 0.15 <seed-hue + 12>)`
rather than red. This is the only vibe that breaks the
"intents stay canonical" rule, and only because terminal aesthetics
require it. Document this exception prominently.

### `--t-brand` semantic token (additive)

```css
@layer tokens.semantic {
  :root {
    --t-brand: var(--t-accent);
    --t-on-brand: var(--t-on-accent);
  }
}
```

Default behavior unchanged: `--t-brand` follows `--t-accent`. Built-in
components do not reference `--t-brand` — it exists for consumer-app
surfaces (hero sections, navbar logo lockup, marketing pages) where
brand identity beats interaction semantics. A `--t-brand` override in
a consumer `theme.css` propagates to the consumer's hero CSS without
touching CTA styling.

### Picker (docs-site)

`apps/docs/src/pages/themes/` (TBD path) renders an interactive picker.
The implementation framework is out of scope for this RFC (see
§ Unresolved questions), but the surface is fixed:

1. **Hue ring** (0–360°) with the safe/avoid zones visualized as bands.
2. **Chroma slider** (0–0.30), clamped per-hue so all 11 ramp steps
   stay inside sRGB gamut.
3. **Vibe radio** — `default`, `natural`, `brutalist`, `terminal`.
4. **Randomize button** — picks from safe hue bands (below).
5. **Live component preview** — every component re-themed in real time.
6. **Brand-collision warning banner** — shown when the picked hue
   sits inside an intent zone.
7. **"Copy CSS" button** — emits the three `--t-seed-*` declarations
   the consumer pastes into their `theme.css`.

### Safe / avoid hue zones (random generator)

```
SAFE = [
  [240, 280],   // blue / violet (CTA-friendly)
  [290, 330],   // magenta / pink
  [331, 360], [0, 10],   // wine / red-pink (skips danger ~25)
  [176, 195],   // teal (skips info ~210)
]

AVOID = [
  [11, 69],     // danger / warning territory
  [90, 135],    // yellow-green (low-contrast, ugly mids)
  [140, 175],   // success territory
  [200, 230],   // info territory
]
```

Total safe range: ~120°. The random button samples uniformly from the
union of safe ranges, then clamps chroma to the per-lightness sRGB
gamut limit.

### Brand-collision warning copy

Shown when the picked hue is inside an AVOID zone:

> **Heads up: your accent collides with the {danger | warning | success
> | info} color.**
>
> A primary button at this hue will look like a {Delete | Caution |
> Success | Info} button to your users. If this is your brand color,
> set `--t-brand` to it for hero / logo surfaces, and pick a different
> accent (we suggest one ~120° away from your brand) so CTAs stay
> distinct.

The picker offers a "use as brand instead" button that locks the
current value into `--t-brand` and prompts for a new accent.

### Docs page hierarchy

The `docs/themes` page MUST render in this order:

1. The picker (above).
2. Live component grid.
3. Semantic-token table — the ten tokens consumers read 95% of the
   time, each with a one-line usage hint.
4. **"Show raw scale" toggle** (collapsed by default) — reveals the
   full 50–900 ramps. Each step is *labeled by purpose*, Radix-style:

| Step | Purpose |
|---|---|
| 50, 100 | App backgrounds, subtle surfaces |
| 200, 300, 400 | Component fills (rest / hover / active) |
| 500 | Solid button background — accent anchor |
| 600, 700 | Borders, dividers |
| 800, 900 | Text on light backgrounds |

A 200-swatch wall without labels is the explicit anti-pattern this RFC
forbids in the docs.

### Backwards compatibility

- A consumer who has hand-authored `--t-accent-500` in their
  `theme.css` continues to work — derivation skips tokens already
  declared further down the cascade.
- The `editorial` theme (planned in `docs/architecture/themes.md`)
  continues to work — it overrides Tier-2 semantic aliases, not
  Tier-1, and is unaffected by the derivation step.
- A consumer who does *nothing* gets a retuned default palette
  (indigo-violet, hue 268°). This is a visual change but not an API
  change; deferred to § Drawbacks.

## Drawbacks

1. **New PostCSS plugin.** Adds `@teseor/postcss-derive-colors` to the
   pipeline (ADR-0003 territory). One more thing to maintain, one more
   place to debug source-vs-output mismatches. Worth it because the
   alternative (hand-authoring) is the problem this RFC exists to fix.

2. **Default palette visually changes.** Today's default accent moves
   from blue (250°) to indigo-violet (268°). This is a deliberate
   choice — see § Detailed design — but every consumer who hasn't
   customized colors sees a different default. Mitigation: ship the
   change in a clearly-noted minor bump; the change is purely visual,
   no API breaks. Consumers who want the old blue can set
   `--t-seed-hue: 250` in their `theme.css`.

3. **`terminal` vibe breaks the "intents stay canonical" rule.** This
   is documented as a vibe-specific exception, but it's still an
   exception. Reviewers should weigh whether `terminal` is worth the
   special case.

4. **Brutalist ramp shape is opinionated.** The flattened midtones are
   the design intent, but they make `--t-neutral-50` look heavier than
   in other vibes. Consumers using `brutalist` who want a smoother
   neutral surface have to either pick a different vibe or override
   neutral steps manually.

5. **Random-button design is its own UX problem.** The safe-zone
   sampling is a starting point, not a complete spec — it doesn't
   model "feels like the same brand twice in a row", chroma variance,
   or the picker's keyboard accessibility. Implementing PR will
   surface more.

## Alternatives

**Do nothing.** Keep the current 60-value Tier-1 surface; document the
"hand-author your ramps" path more loudly. Cost: consumers continue
to either skip theming or copy the entire ramp block from
`tokens.css`, and the brand-collision trap stays unguarded. The themes
picker remains undeliverable. Rejected: the friction is real and
visible on every theme attempt we've seen.

**Material-3-style five-key-color derivation.** Material derives a
primary + secondary + tertiary + neutral + neutral-variant from a
single source color via algorithmic hue/chroma adjustment. More
expressive than 1-seed (multiple key colors fall out automatically).
Rejected: introduces "secondary" and "tertiary" surfaces that Teseor's
component contracts don't currently need, and the algorithm is dense
enough that the picker would need significant explanation. The 1-seed
+ vibe approach delivers similar variety with a much smaller
conceptual surface.

**Two-seed (accent + neutral hue) like the brainstorming
intermediate option.** Lets the consumer pick a warm-tinted gray
independently of the accent. Rejected: the vibe presets already cover
the "warm vs cool vs pure" neutral question without adding a second
slider; one input is the right floor for an opinionated DS picker.

**Runtime JS theme generator** (publish a `generateTheme({accent,
vibe})` helper). Rejected: contradicts Teseor's no-JS-in-the-library
positioning. The derivation belongs at build time; the runtime cost
is zero CSS variables and one identifier lookup.

## Adoption strategy

- **Migration window.** Ships in a minor bump. Additive: no token
  names change, no class names change.
- **Codemod.** Not needed — consumers who hand-authored ramps keep
  working; consumers who relied on defaults see the new defaults.
- **Default vs opt-in.** The seed surface is the new default. Setting
  `--t-vibe: default` and `--t-seed-hue: 268` is what `tokens.css`
  ships. Consumers who want the v0.x palette can pin
  `--t-seed-hue: 250` and `--t-seed-chroma: 0.18` (or, if they want
  the old anchor lightness, override `--t-accent-500` directly).
- **Backwards compatibility.** Every consumer override path works
  unchanged: Tier-2 semantic overrides (most common), Tier-1 ramp
  overrides (advanced), full custom theme files (editorial-style).

## Unresolved questions

- **Picker implementation framework.** Astro island? Vanilla HTML +
  module? React island? Deferred to the picker's implementation PR.
- **`terminal` vibe — keep, or split into its own theme?** The
  recolored intents are the only rule break in the RFC. An
  alternative: ship `terminal` as a full theme file (with mono font,
  no radius, etc.) instead of as a palette vibe. Reviewer input
  wanted.
- **APCA vs WCAG 2 for the picker's contrast checks.** APCA is what
  Radix uses and what designers trust, but WCAG 2 ratios remain the
  legal baseline. Show both? Show APCA primary with WCAG as a
  footnote? Deferred to picker design.
- **Dark-mode chroma multiplier.** The proposal says × 0.85 for the
  accent ramp in dark mode (high chroma vibrates on dark
  backgrounds). The exact value and whether to apply the same
  reduction to intent ramps is open.
- **Plugin name and ADR.** The new plugin
  (`@teseor/postcss-derive-colors`) needs its own ADR following the
  `postcss-build-step` (ADR-0003) and `token-driven-component-css`
  (ADR-0008) pattern. Defer to implementation PR.

## What this doesn't propose

- **Full themes** (font + radius + density + density bundles like
  `editorial`). The vibe presets here are **palette derivation only**.
  A brutalist *theme* (with `radius: 0`, chunky borders, mono fonts) is
  a separate file under `themes/`, orthogonal to this RFC.
- **Per-component color tokens** (`--t-button-bg-hover` etc.) — already
  handled by Tier 3 (`docs/architecture/three-tier-tokens.md`).
- **`--t-brand` adoption inside built-in components.** `--t-brand` is
  exposed for consumer apps only; no Teseor component reads it.
- **APCA as the project-wide contrast target.** Worth a separate RFC
  if reviewers want it.
- **Codemod from current hand-authored ramps.** Change is additive;
  no migration script needed.

## Lifecycle reminder

- `draft` — opened for discussion. This PR adds the file in `draft`.
- `proposed` — design is stable; ready for a final pass before
  implementation.
- `accepted` — implementation has landed.
- `rejected` — closed without implementation.
- `superseded` — replaced by a later RFC.

[issue-750]: https://github.com/teseor/teseor/issues/750
