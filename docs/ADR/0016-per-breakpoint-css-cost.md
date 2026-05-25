# ADR-0016 — Per-breakpoint CSS cost: status quo with a per-component brotli budget

- **Status:** Accepted.
- **Deciders:** repo owner (letanure).

## Decision

Keep the current per-breakpoint emission for responsive props (each
`@each $bp` loop expands into `breakpoints × values` rules per
responsive prop, per component). Do not introduce a build-time
breakpoint configuration, wrapper-resolved inline custom properties,
or per-breakpoint-set entry points. Adopt a per-component brotli
budget on the share of bytes attributable to per-breakpoint `@media
(--<bp>)` blocks: any single component whose breakpoint share crosses
**50%** of its own brotli size is treated as a signal to revisit this
ADR, not a hard fail. The measurement runs automatically as part of the
existing size-report workflow (sticky PR comment, refreshed on every
push to the PR branch), so the budget is visible in the same place
the size table already lives — not gated on someone remembering a
manual command.

## Why this and not one of the alternatives

- **Measurement undercuts the issue's "structural cost" framing.** Across the
  five components shipped today the breakpoint share is **17% of total brotli
  bytes (826 / 4809)** and is **concentrated in layout primitives** — Stack
  37%, Cluster 39%, Tooltip 12%, Button 9%, Modal 0%. Interactive components
  pay near-zero; the cost does not scale uniformly as components are added.
- **The raw-vs-brotli ratio is overstated.** The issue cited "roughly 10x"; the
  measurement shows **2-4x** — raw bp share runs 31–75%, brotli runs 9–39%.
  The compressor already collapses the near-identical per-breakpoint blocks.
- **Build-time breakpoint configuration moves complexity to consumers.** The
  generator would have to ingest a consumer-supplied set, the docs would have
  to document the matrix, and `pnpm gen` would need a per-build invariant
  check. The saving on layout primitives is real (~37%) but the surface lands
  on every consumer for a feature most won't use.
- **Wrapper-resolved inline custom properties trades CSS bytes for inline-style
  bytes.** The layout primitives lose the `breakpoints × values` combinatorial
  but every consumer's HTML gains inline `--_*` declarations. The frameworkless
  (HTML+CSS-only) API gets worse, not better. The net byte saving is consumer-
  specific.
- **Per-breakpoint-set entry points or packages** add packaging complexity for
  a saving that hasn't been requested by any consumer to date.
- **A consumer-side strip step** only helps consumers with a build pipeline,
  excluding the frameworkless path the project explicitly supports.
- **A standalone `pnpm size:bp` script** would land but go unused: it's not
  reflexive in the PR review path, and once it goes stale nobody notices.
  Putting the number in the PR-comment table forces visibility on every push.

## Consequences

- The project keeps the current `@each $bp` source pattern and per-breakpoint
  emission. No breaking change to the public CSS, no change to the wrappers,
  no change to the codegen.
- The size-report PR-comment workflow gains a per-component breakpoint-share
  column. The sticky comment is created when a PR opens and refreshed on each
  push to the PR branch, so a layout primitive crossing 50% surfaces as soon
  as the offending change lands on the branch — not on the next time someone
  runs a forgotten script.
- The 50% threshold is a soft signal, not a CI failure. When a component
  crosses it, this ADR is revisited with the new measurement; the threshold
  exists so the conversation has a number, not so a PR is blocked.
- The brotli share for a future layout primitive with many responsive props
  is the most likely trigger. If a real consumer requests a smaller breakpoint
  set (e.g. only `md` + `lg`), that request — not the speculative cost — is
  the right driver to revisit, and either the build-time config or the
  wrapper-resolved-inline-vars option becomes the right answer in that
  specific context.

## Measurement at the time of decision (2026-05-25)

| Component | Brotli total | Brotli bp share | % bp |
| --- | --- | --- | --- |
| `button.css` | 1350 | 116 | 9% |
| `cluster.css` | 757 | 295 | **39%** |
| `modal.css` | 451 | 1 | 0% |
| `stack.css` | 601 | 221 | **37%** |
| `tooltip.css` | 1650 | 193 | 12% |
| **Total** | **4809** | **826** | **17%** |
