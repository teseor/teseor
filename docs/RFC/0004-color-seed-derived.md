---
status: draft
proposed: 2026-05-26
decided:
supersedes: 0002
---

# 0004 — color: seed-derived cascade

## Summary

Replace today's ~60 hand-tabulated OKLCH ramp values in `tokens.css` with a three-level runtime cascade derived from **one CSS color**, `--t-seed`. A second knob, `--t-harmony` (0–1), controls how strongly intent families drift toward the seed hue (default 0 = canonical hues). Each family anchor (`--t-accent`, `--t-danger`, `--t-warning`, `--t-success`, `--t-info`, `--t-neutral`) derives from the seed via `color-mix(in oklch, …)`. Each 50–900 ramp step derives from its anchor via `oklch(from var(--t-<family>) <L> <C> <H>)`. Override `--t-seed` → everything re-derives. Override a family anchor → that family's ramp re-derives. Override an individual step → cascade wins. Pure runtime CSS — no PostCSS plugin. Supersedes RFC-0002 ([PR #751](https://github.com/teseor/teseor/pull/751)), which proposed a build-time plugin and a separate `--t-vibe` axis.

## Motivation

Two real frictions, plus a third that surfaced during tokens-v4.

1. **The "I want a Teseor in my brand color" workflow has no entry point.** To retheme color, a consumer either overrides one or two semantic aliases (`--t-accent`, `--t-fg`) and accepts the rest of the default ramps, or hand-authors all ~60 Tier-1 values. The middle path — "pick one color, get a coherent palette" — doesn't exist. RFC-0002 identified this gap; this RFC inherits the framing and resolves the open questions RFC-0002 left.

2. **Tier-1 is hand-tabulated.** `tokens.css` currently ships 11 neutral steps + 50 family-ramp values across accent / success / warning / danger / info. Each was authored by hand. Cross-family consistency is enforced by review, not by formula. Shifting the accent hue today means re-tabulating 10 values; shifting the chroma curve means re-tabulating 50. Tokens-v4 demonstrated that this kind of work belongs in `calc()` and CSS color-modification primitives, not in a YAML or a build-step plugin.

3. **RFC-0002 was written before Baseline reached relative-color syntax.** `oklch(from var(--c) <L> <C> <H>)` reached Baseline "widely available" on 2025-11-09. `color-mix()` has been Baseline since 2023. The build-time PostCSS plugin RFC-0002 proposed (`@teseor/postcss-derive-colors`) exists to do at build time what these two CSS features now do at runtime — without solving the sRGB gamut-clamping problem the plugin would still have to handle separately. Runtime derivation costs the same and eliminates the plugin entirely.

The originating issue is [#750]; the inflight RFC this one supersedes is [PR #751].

## Detailed design

### The two knobs

```css
:root {
  --t-seed: oklch(0.58 0.20 268);   /* one color. any format (oklch / hex / hsl / named). */
  --t-harmony: 0;                   /* 0 = canonical intent hues; 1 = full drift to seed. */
}
```

`--t-seed` is the *only* required input for a re-themed Teseor. `--t-harmony` is optional; default 0 preserves canonical intent recognition. Both are Tier-2 declarations at `:root` and override-able anywhere down the cascade.

### Canonical intent hues (private constants)

```css
:root {
  --_canon-danger:  25;
  --_canon-warning: 80;
  --_canon-success: 155;
  --_canon-info:    210;
}
```

These are the hue values today's `tokens.css` ships. They survive the refactor unchanged. Private (`--_*`) — never read by consumers, never read by component files; tokens.css internal.

### Family anchors — Level 2 defaults

Each family anchor derives from the seed at a family-specific lightness, with chroma inherited from the seed, and hue mixed between the canonical and the seed hue by `--t-harmony`:

```css
:root {
  --t-accent: var(--t-seed);                                              /* seed pass-through */

  --t-danger: color-mix(in oklch,
    oklch(from var(--t-seed) 0.48 c var(--_canon-danger)),                /* canonical hue branch */
    oklch(from var(--t-seed) 0.48 c h),                                   /* seed hue branch */
    calc(var(--t-harmony) * 100%));

  --t-warning: color-mix(in oklch,
    oklch(from var(--t-seed) 0.68 c var(--_canon-warning)),
    oklch(from var(--t-seed) 0.68 c h),
    calc(var(--t-harmony) * 100%));

  --t-success: color-mix(in oklch,
    oklch(from var(--t-seed) 0.62 c var(--_canon-success)),
    oklch(from var(--t-seed) 0.62 c h),
    calc(var(--t-harmony) * 100%));

  --t-info: color-mix(in oklch,
    oklch(from var(--t-seed) 0.55 c var(--_canon-info)),
    oklch(from var(--t-seed) 0.55 c h),
    calc(var(--t-harmony) * 100%));

  --t-neutral: oklch(from var(--t-seed) 0.50 calc(c * 0.025) h);          /* faint seed tint */
}
```

**Family anchor lightness — staggered for color-blind separation.**

| Family | Anchor L | Rationale |
| --- | --- | --- |
| `--t-accent` | seed.L (pass-through) | Consumer-chosen; default seed at L=0.58 |
| `--t-danger` | 0.48 | Darker; adds weight; separates from success luminance-wise |
| `--t-warning` | 0.68 | Lighter; amber reads "alert" not "stop" |
| `--t-success` | 0.62 | Mid-light; distinct from danger under deuteranopia |
| `--t-info` | 0.55 | Mid; distinct from accent in default seed |
| `--t-neutral` | full 0.97 → 0.00 ladder | Unchanged from today |

Today's clustered intent-500 lightness (danger 0.62, success 0.65, info 0.65, accent 0.65) collapses under deuteranopia (≈5% of male users) — danger and success are within 0.03 L of each other, info matches success exactly. Staggering by lightness preserves separation even when hue collapses ([Wong 2011, *Nature Methods*](https://www.nature.com/articles/nmeth.1618); [Smashing — Designing for Colorblindness](https://www.smashingmagazine.com/2024/02/designing-for-colorblindness/)).

This is a defaults claim, not an enforced guarantee — consumers who override a family anchor can re-introduce the collision. The picker (deferred follow-up) is where the warning lives.

### Ramp steps — Level 3 defaults

Each family's 50–900 ramp derives from its anchor by replacing L with a fixed ladder step and scaling C by a fixed multiplier table. Hue is inherited via the `h` keyword. Form (shown for accent; same shape for danger / warning / success / info / neutral):

```css
:root {
  --t-accent-50:  oklch(from var(--t-accent) 0.97 calc(c * 0.11) h);
  --t-accent-100: oklch(from var(--t-accent) 0.93 calc(c * 0.30) h);
  --t-accent-200: oklch(from var(--t-accent) 0.86 calc(c * 0.55) h);
  --t-accent-300: oklch(from var(--t-accent) 0.78 calc(c * 0.75) h);
  --t-accent-400: oklch(from var(--t-accent) 0.71 calc(c * 0.92) h);
  --t-accent-500: var(--t-accent);
  --t-accent-600: oklch(from var(--t-accent) 0.48 calc(c * 0.95) h);
  --t-accent-700: oklch(from var(--t-accent) 0.40 calc(c * 0.83) h);
  --t-accent-800: oklch(from var(--t-accent) 0.32 calc(c * 0.70) h);
  --t-accent-900: oklch(from var(--t-accent) 0.24 calc(c * 0.55) h);
}
```

**Lightness ladder** (constant across families): `0.97 / 0.93 / 0.86 / 0.78 / 0.71 / anchor / 0.48 / 0.40 / 0.32 / 0.24`. Matches today's `tokens.css` ladder; step 500 is the family anchor (carried through).

**Chroma multiplier table** (constant across families): `0.11 / 0.30 / 0.55 / 0.75 / 0.92 / 1.00 / 0.95 / 0.83 / 0.70 / 0.55`. Half-cosine peaking at 500. Matches the shape today's hand-tabulated ramps approximate; expressing it as a formula makes the curve auditable.

### The three override levels

```css
/* === Level 1 — one knob. The default is a Teseor-flavored indigo. === */
:root {
  --t-seed: oklch(0.58 0.20 268);
  --t-harmony: 0;
}

/* === Level 1 (lazy) — "redish DS". One color, drift everything. === */
:root {
  --t-seed: oklch(0.58 0.22 25);   /* or literally `red` */
  --t-harmony: 1;
}

/* === Level 2 — pin specific intents. Seed handles the rest. === */
:root {
  --t-seed: oklch(0.58 0.20 268);
  --t-danger:  oklch(0.50 0.25 15);
  --t-success: oklch(0.62 0.18 145);
}

/* === Level 3 — override individual ramp steps. === */
:root {
  --t-accent-500: oklch(0.55 0.20 270);
  --t-danger-700: oklch(0.30 0.18 15);
}
```

Cascade does the work. No precedence rules to invent — each layer overrides the previous by being declared later (within `:root`) or by living in a more-specific selector / theme attribute.

### Forced-colors path

The existing `@media (forced-colors: active)` block in `tokens.css` keeps its semantic-token mapping (`--t-accent: ButtonText`, etc.). The derived ramps are only consumed when forced-colors is *not* active; under forced-colors, the semantic tokens point directly at CSS system colors, so the seed / harmony machinery is unread. No change to the forced-colors contract.

### What happens to `postcss-teseor-floor`

The build-time plugin that inlines third-position literal fallbacks for components used standalone (see `docs/architecture/three-tier-tokens.md` § "Build step", ADR-0003) keeps working. The plugin reads `tokens.css`, resolves the cascade for the default `--t-seed` value, and emits literal OKLCH values as the third position in each component's `var()` chain. The plugin needs one extension: evaluate `oklch(from <color> …)` and `color-mix(in oklch, …, …, …)` expressions to a literal during resolution. This is a small additive change, not a new plugin.

The literal floor is the *default-seed* output. Consumers who set `--t-seed` at runtime get the runtime-derived ramp; the literal floor is only load-bearing when a component file is loaded without `tokens.css` (the standalone-component case).

### What this RFC ships in phases

Three sequential PRs, mirroring tokens-v4's shape:

1. **Phase 1 (#820) — seed surface + accent derivation.** Introduce `--t-seed` and `--t-harmony` at `:root`, defaulted to `oklch(0.65 0.18 250)` (today's `--t-accent-500` value) and `0`. Refactor `--t-accent-{50..900}` to derive from `--t-seed` via `oklch(from …)`. Keep neutral and intent ramps hand-authored (unchanged). Internal refactor — resolved values identical at the default seed.

2. **Phase 2 (#821) — intent + neutral derivation + staggered anchor L.** Refactor `--t-danger-*`, `--t-warning-*`, `--t-success-*`, `--t-info-*`, `--t-neutral-*` to derive from family anchors. Adopt the staggered per-family anchor L (danger 0.48, warning 0.68, success 0.62, info 0.55). Visual change — intent ramps shift to staggered lightness. Visual-regression snapshots required.

3. **Phase 3 (#822) — retune default seed.** Shift `--t-seed` default from `oklch(0.65 0.18 250)` (today's accent-500 reskinned as seed) to `oklch(0.58 0.20 268)` (RFC-0002's indigo-violet). Pure value change, no API change. Documented as a deliberate default refresh.

## Drawbacks

- **DevTools readout regresses further.** Tokens-v4 already moved spatial tokens into `calc()` chains; this RFC does the same for color via `oklch(from …)` and `color-mix(…)`. Computed-style panels show the expression, not the literal. Resolved values still display (the swatch is correct), but the raw declaration is uglier. Same trade tokens-v4 accepted.

- **Runtime expression evaluation cost.** Every `var(--t-accent-50)` reference triggers two relative-color resolutions (anchor + step) on first paint. Negligible for static palettes (browsers cache); measurable only if a consumer animates `--t-seed`. Not a real concern given the use cases, but worth flagging.

- **Browser gamut clipping is naive.** Browsers clip out-of-gamut OKLCH values component-wise instead of CSS Color 4's binary-search chroma reduction. For high-chroma seeds (`--t-seed-chroma > 0.25`), the lightest/darkest steps may hue-shift visibly. The picker (deferred) can warn; the CSS layer cannot prevent. Same problem RFC-0002's PostCSS plugin would have had unless it wrote the chroma reduction itself, which RFC-0002 did not commit to.

- **`postcss-teseor-floor` needs to evaluate relative-color syntax.** Currently the plugin walks `var(--t-*)` chains and substitutes literal values. With this RFC it also evaluates `oklch(from <color> …)` and `color-mix(in oklch, …)` to compute the literal floor. Small additive change; the alternative (skip these tokens in the inliner and ship components without color literals) would break the standalone-component load case.

- **No `--t-brand` slot.** RFC-0002 proposed `--t-brand` separate from `--t-accent` to handle the brand-vs-CTA collision (a consumer whose brand is red wants the marketing surface red but the primary CTA non-red). This RFC drops that slot — the picker is where the collision warning lives, and consumers who need brand-distinct-from-accent can declare a custom variable in their `theme.css` without library buy-in. A follow-up RFC can revisit if the collision proves to be a real consumer ask.

- **Color-blind staggering is a default, not a guarantee.** Consumers who override a family anchor at Level 2 can re-create the equal-L deuteranopia collision in one line. The token system cannot enforce; the picker can warn at generation time.

## Alternatives

### Alternative A — keep RFC-0002 as proposed

Ship the build-time PostCSS plugin (`@teseor/postcss-derive-colors`) + the `--t-vibe` axis (default / natural / brutalist / terminal).

Rejected on three grounds:

1. **Tokens-v4 just made the opposite call** — pure-CSS derivation for the spatial system, no PostCSS plugin for the derivation. Splitting strategies between color and spacing has no architectural justification.
2. **`oklch(from …)` is Baseline.** The plugin's only technical justification was Baseline gaps that no longer exist as of late 2025.
3. **The vibe axis is a separate dimension** that doubles the picker surface (a hue knob + a vibe radio) without adding orthogonal expressiveness. A "natural"-vibe DS is a `--t-seed` with low chroma; a "brutalist"-vibe DS is a separate theme file (font + radius + spacing changes, not just palette derivation). The vibe presets collapse cleanly into other axes.

### Alternative B — adopt Material-3-style "everything from seed" including intents

Derive intent hues from the seed via fixed offsets (e.g., danger = `seed - 120°`, success = `seed + 60°`). One knob, full harmony.

Rejected: Material 3 itself does not do this. `core_palette.ts` hardcodes `error` at hue 25° / chroma 84, completely independent of the seed; MD3 ships no `success` / `warning` / `info` roles. The most aggressive single-seed system in production locks the only semantic-recognition color it ships. The intent-recognition literature ([NN/g](https://www.nngroup.com/articles/color-enhance-design/)) does not back universal hue meaning, but globalization has produced enough convention (red = stop, green = go in the West) that defaulting to canonical hues at Level 1 is the safer baseline. Consumers who want the maximalist look raise `--t-harmony` to 1; the option exists without being the default.

### Alternative C — ship intents as suggestions, not locked aliases

Follow the Tailwind / Radix / shadcn pattern: don't ship `--t-danger` / `--t-success` / `--t-warning` / `--t-info` as first-class aliases. Provide raw hue scales and let consumers alias.

Rejected: today's `tokens.css` already ships these aliases; components already reference them. Removing them is a breaking change with no offsetting win — the enterprise-pattern audience for which this stance is most appropriate (Atlassian / Polaris / Primer) is also where Teseor's component contracts feel most at home.

### Alternative D — keep two-variable seed (`--t-seed-hue` + `--t-seed-chroma`)

Expose hue and chroma as separate tokens. RFC-0002's original surface.

Rejected: the consumer-facing pitch "set one color" is literally true with a single `--t-seed`. Decomposition via `oklch(from var(--t-seed) …)` is what the token reads internally; consumers write `--t-seed: red` or `--t-seed: oklch(0.58 0.20 268)` or `--t-seed: #5b6cff`. The two-variable form pushes OKLCH literacy onto consumers who don't need it.

### Alternative E — build-time plugin to pre-compute the cascade

A variant of A: keep runtime overrides (Level 2 / 3) but use a plugin to emit Tier 1 ramps as literals at build time, reading `--t-seed` from `tokens.css`.

Rejected: this is what RFC-0002 was. It buys nothing over runtime derivation now that relative-color is Baseline. A plugin that "just inlines literals" can already do that — `postcss-teseor-floor` does — and it inlines the *default*-seed literals as fallbacks. There is no consumer benefit to also pre-computing the live-derived values.

## Adoption strategy

### Migration window

- **Phase 1** ships as a non-breaking minor changeset. Default-seed-derived `--t-accent-*` resolves to the same OKLCH literals today's `tokens.css` ships at scale 1. No consumer code change; no visual diff.

- **Phase 2** changes the resolved values of intent ramps (staggered anchor L). Documented as a deliberate visual refresh with before / after screenshots in the release notes. Pre-1.0 minor. Consumers who pinned a Tier-1 intent value (`--t-danger-500: oklch(…)` in their `theme.css`) keep their override.

- **Phase 3** changes the default seed from indigo-blue (0.65 / 0.18 / 250) to indigo-violet (0.58 / 0.20 / 268). Visual diff for consumers who haven't overridden `--t-accent` or `--t-seed`. Pre-1.0 minor with explicit "default refresh" callout.

If the v1.0 cut date falls inside this phase plan, Phase 3 may be deferred to v1.1 to keep v1.0's default palette stable across the launch window. Reviewer call.

### Codemod

None across all three phases. Token names are unchanged; values shift but the variable surface is identical. Consumers who hand-authored Tier-1 ramps (the RFC-0002 "full overrides" path) keep working — their declarations win over derived values via cascade.

### Default vs opt-in

The three-level cascade is the default immediately. There is no "opt out of derivation" path — the derived values match (Phase 1) or refresh (Phase 2 / 3) the previous values without a behavior toggle.

### Backwards compatibility

- Consumer `theme.css` that overrides `--t-accent` directly: keeps working; the new `--t-accent: var(--t-seed)` default is what their `theme.css` overrides.
- Consumer `theme.css` that overrides individual ramp steps (`--t-accent-500: …`): keeps working; their value wins over the derived expression via cascade.
- Consumer that reads `--t-success-500` etc. in custom CSS: keeps working; the resolved value is computed at use time.
- Forced-colors mapping: unchanged.

The only consumer-facing change is the resolved palette values (Phase 2 / 3). Documented as a visual refresh.

## Unresolved questions

- **Phase 3 timing relative to v1.0.** If v1.0 is close, the default-seed retune (indigo-blue → indigo-violet) may be worth deferring to v1.1 to keep v1.0's headline visual stable. Decision belongs to the release-cut window, not this RFC.

- **Picker UX.** The "set seed + see palette" picker is implied by this RFC's framing but not specified here. The picker is the surface where color-blind warnings, brand-vs-CTA collision warnings, and seed-randomization heuristics live. Filed as #823, mirrored on `docs/architecture/themes.md` § "v1.0 minimum: two themes" planning.

- **`--t-harmony` granularity.** Currently a single 0–1 knob applied uniformly to all intent families. Worth considering per-family harmony (e.g., `--t-harmony-danger: 0`, `--t-harmony-warning: 1`) for consumers who want danger always canonical but warning to drift. Defer; revisit if the picker design surfaces the need.

- **`@property --t-seed` and `@property --t-harmony`.** Would give type safety, validation, and the ability to animate the seed. Mirrors the open question on `--t-unit` from RFC-0003 (#817). File as a follow-up.

- **Dark-mode chroma reduction.** Saturated OKLCH values can read as vibrating on dark backgrounds. The current `prefers-color-scheme: dark` branch (when added) may want to multiply seed chroma by ~0.85. Defer to the dark-mode RFC (tracked under #774).

- **`--t-brand` decision finality.** Dropping `--t-brand` is correct for the picker-warning-handles-it model, but if real consumers ask for a brand-vs-CTA split slot, a follow-up RFC can add it without breaking this one.

## What this doesn't propose

- **Dark mode.** This RFC covers the light-mode palette only. Dark mode is tracked separately under #774 and will get its own derivation pattern (likely a sibling cascade rooted at a dark-mode `--t-seed` value or chroma multiplier).

- **The picker / theme generator.** A `teseor.dev/themes` picker that emits seed + harmony + per-intent overrides as a copyable CSS block is implied by this RFC but specified in #823. The CSS layer this RFC defines is the picker's output surface, not its UX.

- **APCA contrast targets.** WCAG 2.2 AA remains the contrast baseline (`docs/architecture/three-tier-tokens.md` § "On-X foreground aliases" already documents this). APCA evaluation is worth its own RFC if reviewers want it; this RFC does not require or block it.

- **Color-blind safety enforcement.** The staggered anchor L ships color-blind-safer defaults but doesn't enforce. Enforcement is a picker-level concern (warn when overrides break separation) or a docs-level concern (lint themes for cb-safety), not a CSS-token concern.

- **Theme file format changes.** Themes still write Tier-2 semantic aliases as before (`docs/architecture/themes.md` § "Hard rule"). They can additionally set `--t-seed` and `--t-harmony`. The themes lint rule is unchanged.

- **Codegen or spec-schema changes.** Spec files still list `tokens:` slot names; the derivation of underlying values is invisible to spec readers.

- **Removal of RFC-0002's PR #751.** PR #751 stays open until reviewer confirms supersede. The RFC-0002 doc file is never merged to main; it lives in PR #751 as the rejected-alternative-document. When this RFC reaches `proposed`, RFC-0002's PR can be closed with a pointer to this RFC.

## Lifecycle reminder

- `draft` — opened for discussion. This PR adds the file in `draft`.
- `proposed` — design is stable; ready for a final pass before implementation. RFC-0002 PR #751 can be closed at this transition.
- `accepted` — Phase 3 has merged.
- `rejected` — closed without implementation.
- `superseded` — replaced by a later RFC.

[#750]: https://github.com/teseor/teseor/issues/750
[PR #751]: https://github.com/teseor/teseor/pull/751
