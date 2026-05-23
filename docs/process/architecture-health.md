# Architecture health

Architecture quality should be reviewed as an operating signal, not only as a
design opinion.

## Monthly review cadence

Once per month, review the current default branch and the last month's PRs.
Use GitHub Actions history, PR history, and recurring CI failures as inputs.

## KPIs

### CI signal quality

- **Time to first fast-path result** — how quickly `lint`, `typecheck`,
  `test-unit`, and `changeset` tell contributors a branch is healthy or not
- **Time to full green** — how long it takes a normal PR to clear the full CI
  path
- **Flaky-check count** — any job that reruns clean without a code change

### Generator and contract health

- **`gen-drift` failure rate** — how often contributors edit the wrong layer or
  forget regeneration
- **Codegen paired-test failures** — how often `lint:codegen-tests` catches an
  unpaired generator change
- **Wrapper runtime drift** — any React/Vue runtime divergence found in review
  or contract tests

### Contributor-experience health

- **Time from first push to first actionable failure** — if this is slow,
  contributors wait too long before getting useful feedback
- **Repeat-doc questions in review** — anything contributors repeatedly ask
  wants a clearer doc or a clearer link
- **Setup friction** — any recurring local-tooling failure during onboarding

## Expected actions

- If fast-path time grows, tighten staging before adding more checks.
- If drift failures recur, improve docs or generator ergonomics before adding
  more policy.
- If contributors repeatedly miss "planned versus shipped" boundaries, update
  `docs/architecture/at-a-glance.md` and the status sections in architecture
  docs first.
