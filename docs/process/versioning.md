# Versioning

Practical-strict SemVer, enforced by changesets + CI + migration tooling. `release.md` covers the release *mechanics* (changesets, publish, tags); this doc covers the *policy* (what counts as breaking, deprecation lifecycle, migrations, codemods).

## Pre-1.0 vs post-1.0

We follow **practical-strict** SemVer: minor/patch retain semantics at every version, including pre-1.0. Major bumps happen more frequently during 0.x while the API stabilizes, but never silently.

We rejected the literal SemVer reading ("0.x.y = anything goes") because design systems live in consumer markup — class names, token names, prop names appear in HTML, CSS, and TSX across consumer apps. A pre-1.0 minor that silently renames a class breaks production. Practical-strict gives consumers `~0.4.x` as a safe pin throughout the 0.x phase.

## What counts as breaking

**For CSS (`@teseor/css`)** — bump major when:

- A `.t-*` class is renamed
- A `--t-*` public token is renamed
- A variant/intent/size value is removed (e.g. dropping `variant: link`)
- A CSS feature is dropped without a fallback (raising the browser baseline)
- The visual default shifts in an established use case (e.g. default `radius` for Button moves from `md` to `lg` — consumers' renders change)

**Not breaking** (minor):

- Adding new variants/intents/sizes
- Adding new tokens
- Internal refactor preserving visual output (patch)
- Adding new utility classes

**For wrappers (`@teseor/react`, etc.)** — bump major when:

- A prop is removed
- A prop is renamed
- An optional prop becomes required
- A default value is removed (changes runtime behavior for consumers relying on the default)
- An exported function is removed
- A TypeScript return type narrows (consumer code that used the wider value breaks)
- A TypeScript param type widens (consumer code that passed narrow types may now be required to handle the wider input)

**Not breaking** (minor):

- Adding an optional prop with a default
- Loosening param types (widening what consumers can pass in)
- Tightening return types (narrowing what consumers receive — they were already coping with the wider value)
- Adding new exports

The asymmetry on TS types is deliberate: types break consumer code in both directions, but the direction matters. Returns narrow-safely; params widen-safely.

## Deprecation lifecycle

Removal is preceded by deprecation. The lifecycle is **2 minor releases between `deprecated: true` and removal** — version-based, not time-based, because cadence varies and version arithmetic doesn't.

The spec carries the deprecation metadata:

```yaml
props:
  loadingState:
    type: boolean
    default: false
    deprecated:
      since: "0.4.0"
      removeBy: "0.6.0"
      replacement: "loading"
```

What this drives:

- `gen-contract` emits `@deprecated` JSDoc on the TS prop → consumers see the warning in their IDE.
- `gen-docs` renders a deprecation banner on the component page with the replacement name and timeline.
- The CI gate fails if a deprecated symbol is still present after `removeBy` — keeps removal on schedule.

Deprecation is the slow path. The fast path (drop it now, ship the breaking change) is allowed when the maintainer decides the rename can't wait — but it still rides a major bump and a migration guide.

## Migration guides

Every major bump produces one migration document at `docs/migrations/v<from>-to-v<to>.md`. The doc is **auto-built from changeset frontmatter** rather than hand-authored.

Each breaking changeset declares `migration:` content:

```md
---
"@teseor/css": major
"@teseor/react": major
migration: |
  ## `.t-btn` → `.t-button`
  Class name unified with the spec contract. Search-replace.
  Codemod: `npx @teseor/codemods/0.5-to-0.6 --rule=class-rename`
---

Rename `.t-btn` everywhere it appears in consumer HTML and CSS.
```

The build step concatenates every breaking changeset's `migration:` block in order, prepends an overview, and writes `docs/migrations/v<from>-to-v<to>.md`. Linked from:

- The changelog entry for the major release
- The npm release notes
- The component pages that changed (auto-linked from spec deprecation metadata)

Consumers see one document per upgrade, not N scattered changelog entries.

## Codemods

For mechanical breaking changes, we ship codemods. For judgment-required ones, we write the migration guide only.

**Mechanical (codemod ships):**

- Class renames (`.t-X` → `.t-Y`)
- Token renames (`--t-X` → `--t-Y`)
- Prop renames (`loadingState` → `loading`)
- Default value changes where consumer code can be adjusted by string search-replace

**Judgment-required (migration guide only):**

- Semantic shifts (a prop's *meaning* changes, even if the name is the same)
- Removed components without 1:1 replacements
- Composition changes (one component now requires a parent of a different kind)

Codemods live in the monorepo at `packages/codemods/`, published as `@teseor/codemods/<from>-to-<to>`. Built on `jscodeshift` (JS/TS transforms) plus a small CSS transformer for class-rename across `.css` and `.html` files.

Consumer runs:

```bash
npx @teseor/codemods/0.5-to-0.6
# or scoped to a single rule:
npx @teseor/codemods/0.5-to-0.6 --rule=class-rename
```

Idempotent (running twice is a no-op). The migration guide names which rules exist for which renames.

## Changelog

`CHANGELOG.md` lives at the repo root, **auto-generated by changesets** on every release. We don't adopt the manual Keep-a-Changelog format. Reasons:

- Every entry already comes from a changeset (`packages/` change can't merge without one).
- The auto-generated changelog reflects exactly what shipped — no hand-curated section that drifts.
- Migration content (the part of the changelog with real human value) lives in `docs/migrations/v<X>-to-v<Y>.md` (auto-built from changeset `migration:` frontmatter), not the changelog.

Result: `CHANGELOG.md` is a compact list of "what changed at each version"; `docs/migrations/` is the rich migration narrative. No double-maintenance.

## Stability badges

Each component declares its stability in spec:

```yaml
stability: alpha   # alpha | beta | stable | deprecated
```

- **`alpha`** (default for newly-added components) — API may change in any minor; visual baseline may shift; avoid in production.
- **`beta`** — promoted after at least one minor cycle with no breaking changes; visual baseline stable; usable in production with awareness it might change.
- **`stable`** — promoted after at least two minor cycles of no breaking changes; API is committed; visual baseline locked.
- **`deprecated`** — slated for removal; 2 minors before removal (see § "Deprecation lifecycle" above).

The status appears as a badge at the top of the component's docs page, as `@experimental` (alpha/beta) or `@deprecated` JSDoc on the TS wrapper, and as a field in `teseor-ast.json` for downstream tooling (see `architecture/codegen-pipeline.md` § "Outputs"). `validate-spec.ts` rejects unknown values.

## Enforcement loop

The discipline is the same whether we're at 0.2 or 2.5:

1. Every `packages/` change needs a changeset declaring its bump level (CI gate).
2. The changeset's `migration:` field is required when the bump is major (validator check).
3. Deprecated symbols past `removeBy` fail CI.
4. Migration guides auto-build from changesets.
5. Codemods are published with mechanical-change majors.

Strict SemVer here is enforced by tooling, not just policy. The interpretation (pre-1.0 minor still means minor) only matters because the tooling actually treats it that way.

## Sources

- SemVer specification (current)
- `process/release.md` (release mechanics)
- `architecture/codegen-pipeline.md` (deprecation field surfaced from spec)
