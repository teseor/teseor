# Accessibility

WCAG 2.2 Level AA is the floor. AAA-level requirements are adopted where they don't fight other constraints (e.g. touch targets, focus visibility); AAA contrast (7:1) is rejected because it forces black-on-white and kills themes. We document where we exceed AA — most likely contrast with `oklch` themes.

## Five enforcement layers

| Layer | Tool | Catches |
| --- | --- | --- |
| **Lint** | Stylelint rules | `:focus`-without-visible, missing focus ring |
| **Build** | `postcss-teseor-floor` | Forced-colors fallback wiring (system colors as third tier where appropriate) |
| **Codegen** | `gen-tests.ts` reads `spec.a11y.keyboard` | One Playwright test per documented key |
| **Visual + a11y** | axe-core inside Playwright | Zero violations on every component × wrapper × theme |
| **Manual smoke** | Per-release checklist, NVDA + VoiceOver | What automation can't reach |

## Keyboard

Every interactive component declares its keyboard map in spec:

```yaml
a11y:
  role: button
  keyboard:
    Enter: activate
    Space: activate
    Escape: dismiss   # only on dismissible components
  apg: button         # optional — names the ARIA Authoring Practices pattern
```

`gen-tests.ts` reads this and emits Playwright keyboard tests per key. The spec is the contract; the test verifies it.

For stateful components (Combobox, Tabs, Accordion, Menu, Dialog, Listbox), the `apg:` field references the ARIA Authoring Practices Guide pattern name. Implementation follows APG; the docs page links to the upstream APG pattern. Atomic components don't need `apg:` — native semantics carry them.

## Focus

- `:focus-visible` only — `:focus` is Stylelint-banned (hard rule 8).
- `--t-focus-ring` is the token. Themes adjust it; components don't redeclare its visual.
- Every component renders a visible focus ring. Visual baseline catches "ring disappeared" regressions because the snapshot diff includes the focused state.
- Focus order matches DOM order by default. `tabindex` greater than 0 is forbidden (Stylelint-friendly: codegen never emits it; manual usage caught in PR review).

## Reduced motion

Two layers, because they catch different failure modes:

1. **Token-level kill switch.** Every transition multiplies by `var(--t-motion-scale)`. Setting `--t-motion-scale: 0` zeros out durations across the system. `tokens.css` sets it to 0 inside `@media (prefers-reduced-motion: reduce)`.
2. **Keyframe overrides.** Animations declared with `@keyframes` don't multiply through a scalar. For each keyframe animation, the component's CSS provides a `@media (prefers-reduced-motion: reduce)` block that replaces the keyframe with a static state.

Either layer alone leaves a hole — token layer misses keyframes, keyframe layer misses transitions. Both run.

## Forced-colors mode

Windows High Contrast / Forced Colors mode replaces author colors with user-defined system colors. Components must remain operable.

- Components declare `forced-color-adjust: auto` (default; never set `none` without justification).
- Where text-on-fill needs an explicit color in forced-colors, semantic aliases (`--t-fg`, `--t-accent`, …) are re-declared inside `@media (forced-colors: active)` in `tokens.css` (e.g. `--t-fg: CanvasText`, `--t-accent: ButtonText`). `postcss-teseor-floor` walks both the default and forced-colors branches when inlining literals; see `architecture/three-tier-tokens.md` § "Colors" for the token block and `ADR/0003-postcss-build-step.md` § "Forced-colors resolution" for the plugin behavior.
- Visual gate runs **one additional snapshot per component** with `forced-colors: active` emulated (Playwright's `emulateMedia({ forcedColors: 'active' })`). Catches "component disappears" regressions.

## Touch targets

44×44 CSS pixels is the floor at the base breakpoint. Every interactive component root reads `block-size: var(--t-touch-min, 2.75rem)` (or its inline equivalent for horizontal targets). Larger breakpoints may shrink for density (dense forms, data tables) — but only via explicit `data-density="compact"` or similar opt-in.

`--t-touch-min` is a semantic token. Themes can adjust it. Default is `2.75rem` (44px @ 16px root).

## Screen readers

**Automated:**
- axe-core runs inside every Playwright visual test — zero violations gate.
- Playwright's accessibility-tree assertions verify role/name/state for every example: `expect(page.getByRole('button', { name: 'Save' })).toBeVisible()`. Catches the high-impact bugs (wrong role, missing accessible name, broken aria-label wiring).

**Manual:**
- Per-release smoke test on NVDA (Windows) + VoiceOver (macOS). Checklist generated from the components touched in the release.
- ~30 min per release for atomic phases; longer for stateful ones.
- JAWS deferred post-v1.0 — costly license; NVDA covers ~90% of JAWS-relevant regressions.

## Documentation

Every component's docs page surfaces its a11y story (per `spec.a11y` and `docs-site.md` section 11):

- Role + accessible name pattern
- Keyboard map (table from `keyboard:`)
- ARIA states used
- APG pattern link (if applicable)
- Forced-colors behavior notes
- Known limitations

If the a11y story has a known gap, it's documented in *Common mistakes* and an open issue is linked. Hiding gaps is the worst-case failure.

## Sources

- WCAG 2.2 (W3C Recommendation, October 2023)
- ARIA Authoring Practices Guide (current)
