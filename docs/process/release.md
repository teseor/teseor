# Release

Changesets-driven, automated on `main`. Humans write changeset entries; the bot opens the release PR and publishes on merge.

## Tooling

- `@changesets/cli` — local UX (`pnpm changeset`).
- `changesets/action@v1` in `.github/workflows/release.yml` — opens and updates the "Release @teseor/*" PR; publishes on merge.

## Per-PR workflow

1. Author runs `pnpm changeset` after the implementation work.
2. CLI asks which packages changed and at what level (patch/minor/major).
3. CLI writes `.changeset/<slug>.md` with the bump level and a short summary.
4. Author commits the changeset alongside the PR.
5. CI's changeset gate (see `ci-gates.md`) verifies the entry exists if `packages/` changed.

A PR without a changeset entry — when one is required — fails CI. Showcase and tooling PRs are exempt.

## Bump levels

- **patch** — bug fix, internal refactor, perf improvement that doesn't change the public API.
- **minor** — new component, new variant/intent/size on an existing component, new exported function, new optional prop.
- **major** — renamed class (any `.t-*`), renamed public token (any `--t-*`), removed prop, removed component, changed default value visible to consumers.

Class names and public tokens are API (hard rule 9). When you change one, it's major.

## On merge to `main`

The release workflow either:

- **Opens / updates a "Release @teseor/*" PR.** This PR aggregates every unreleased changeset, applies the version bumps, regenerates changelogs, and shows up as a single mergeable PR. Reviewers see exactly what's about to publish.
- **Publishes to npm.** When the release PR itself merges, the action publishes each touched package via `npm publish --provenance`. Provenance attestation is Sigstore-backed and free when publishing from GitHub Actions; consumers see a "verified publisher" badge on npm. The release workflow needs `id-token: write` permission.

**npm only.** No GitHub Packages mirror. Doubling the publish surface adds auth/secret/failure surface for marginal redundancy; GitHub Packages requires authenticated installs in some configs, which worsens consumer ergonomics. If npm has an outage, consumers wait.


## Release cadence

- **Patch on every merge** — if the changeset says patch, a patch publishes.
- **Minor on every merge** — if the changeset says minor, a minor publishes. No batching.
- **Major at milestone boundaries** — e.g. v0.4 → v0.5. Hand-cut: tag the commit, write the release notes, run the action manually. Major changesets accumulate; you don't ship them immediately.

Once published, a version is immutable. We don't unpublish or overwrite npm tags. Mistakes ship as the next patch.

## Packages we publish

All `@teseor/*` packages share one version. Synchronized launch at **3.0.0** (the floor forced by the prior `@teseor/css@2.5.2` already published on the GitHub Packages registry). See ADR-0001 § "Starting npm versions".

| Package | Notes |
| --- | --- |
| `@teseor/css` | The handwritten CSS |
| `@teseor/contract` | Generated TypeScript types |
| `@teseor/react` | Generated wrappers |
| `@teseor/vue` | Generated wrappers |
| `@teseor/svelte` | Generated wrappers |
| `@teseor/angular` | Generated wrappers |
| `@teseor/webc` | Generated LitElement wrappers |
| `@teseor/i18n` | In-house ICU-like framework |
| `@teseor/primitives` | Shared headless logic (v0.4+) |

**Fixed-mode changesets.** `.changeset/config.json` lists all `@teseor/*` packages in one fixed group:

```json
{
  "fixed": [
    ["@teseor/css", "@teseor/contract", "@teseor/react", "@teseor/vue",
     "@teseor/svelte", "@teseor/angular", "@teseor/webc",
     "@teseor/i18n", "@teseor/primitives"]
  ]
}
```

A bump to any one package triggers the same bump across the fixed group. Consumers see consistent versions; cross-package mismatches are impossible.

**Project milestones decouple from npm versions.** "v0.1 Foundation", "v0.2 Button", "v0.3 Atoms" in `roadmap.md` are rewrite phases — they name the work being done. npm versions track the actual cadence. The first published release is `@teseor/*@3.0.0`; subsequent releases bump per the changeset semantics.

Internal-only (not published):
- `@teseor/docgen` — the codegen engine itself
- `apps/docs` — the docs site (deployed, not published)
- `apps/showcase-*` — example apps (deployed if at all)

## Distribution

Three consumer surfaces. Choose by use case.

**1. npm** — primary. All wrapper packages, `@teseor/css`, `@teseor/i18n`, `@teseor/contract` published per the table above. **ESM only:** `package.json` ships `"type": "module"` everywhere, `exports` maps have no `"require"` keys. CJS isn't supported — modern bundlers and Node 22 default to ESM; dual-package hazards aren't worth the support burden. Consumers on CJS-only setups compile their own.

**2. CDN (unpkg + jsdelivr)** — auto-mirrors of npm. No additional infra; both CDNs pick up every published release automatically. Documented consumer pattern:

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/@teseor/css@<version>/dist/teseor.css"
  integrity="sha384-<hash>"
  crossorigin="anonymous"
/>
```

The SRI hash is generated by the publish workflow (`openssl dgst -sha384 -binary dist/teseor.css | openssl base64`) and posted in the release notes. Consumers paste the snippet; integrity is verified by the browser.

**3. GitHub Releases binary assets** — `teseor.css` and `tokens.css` attached to every release via `release.yml`. For zero-build-tool consumers (static HTML pages, Hugo sites, old PHP apps):

```
https://github.com/letanure/teseor/releases/download/v<version>/teseor.css
https://github.com/letanure/teseor/releases/download/v<version>/tokens.css
```

`wget` or `curl` lands the file in a project directory. Three lines added to `release.yml` to attach the assets.

### A-la-carte and tokens-only

The npm path supports four entry-point shapes (mirroring the published-entry-points table in `architecture/codegen-pipeline.md` § "Published CSS entry-points"):

| Specifier | What you get |
| --- | --- |
| `@teseor/css` | Full bundle (`dist/teseor.css`) |
| `@teseor/css/<component>` | One component + its deps (`dist/<component>.css`) |
| `@teseor/css/tokens.css` | Tokens-only (`dist/tokens.css`) — for theming third-party DSes against Teseor scale |
| `@teseor/css/utilities.css` | Utilities-only (`dist/utilities.css`) — for sites that want spacing/display/animation without Teseor components |

CDN and GitHub Releases ship the full bundle and tokens; per-component and utilities-only standalone files are npm-only (avoiding URL-pattern proliferation).

## Sources

- `ADR/0001-rewrite-not-migrate.md` § "Starting npm versions" (synchronized 3.0.0 launch + fixed-mode rationale)
- `process/versioning.md` (bump-level policy this mechanism applies)
- `process/ci-gates.md` § "changeset" (the gate that enforces changeset presence)
