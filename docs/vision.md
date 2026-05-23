# Vision

Teseor is a CSS-first design system. Plain CSS is the source of truth; framework wrappers (React, Vue, Svelte, Angular, web-components) are codegen output. Themes are token-only files. Components compose, they don't bundle.

## Success criteria

- **Small.** Per-component CSS ≤ 4KB min / 1.5KB gz. Full `teseor.css` ≤ 60KB / 12KB gz. React wrapper per component ≤ 1KB gz including types. Enforced by size-limit in CI.
- **Themeable.** Themes write semantic tokens only — they never touch element selectors or component internals. Swap a theme by swapping one CSS file.
- **Framework-agnostic.** Codegen emits React TSX, Vue SFC, Svelte, Angular, and LitElement web-components from one per-component YAML spec. Visual regression must pass for every component × every wrapper × every theme.
- **No anti-patterns.** Logical properties only. No raw hex/rgb/px in components. No `!important` outside `@layer overrides`. `:focus-visible` not `:focus`. `prefers-reduced-motion` honored at two layers (token scale + keyframe `@media`).
- **a11y first.** axe-core zero violations on every generated example. Lighthouse a11y 100 on every docs page. Keyboard maps live in spec and are tested.

## Non-goals (for v0.x)

- A CLI (`npx teseor init/add/eject`) — interesting, post-v1.0.
- An MCP server / "diff a theme" / token-aware a11y — post-v1.0.
- Compile-time theme path (CSS with pre-resolved values, no custom properties) — post-v1.0.
- Slot-based component contracts beyond what HTML composition already gives us — post-v1.0.

See `roadmap.md` for the phased path to v1.0 and the parked long-tail ideas explicitly deferred beyond it.
For the current implemented-versus-planned map, see
`docs/architecture/at-a-glance.md`.
