---
---

Labels housekeeping. `.github/labels.yml` gains a `component:*` AUTO region (regenerated from `specs/*.yaml` by `sync-labels.ts`, same as `labeler.yml`), so the component labels the labeler references are now defined in the catalog. A new `scripts/check-label-sync.ts` fails when `labeler.yml` references a label `labels.yml` doesn't define. The `sync-labels` workflow now runs the drift check and the reference check on pull requests, so `labeler.yml`/`labels.yml` drift is caught before merge instead of going red on `main`. Repo tooling only; no consumer-facing change.
