# ADR-0005 — ADRs are the decision log

- **Status:** Accepted.
- **Deciders:** repo owner (letanure).

## Decision

`docs/ADR/` is the canonical decision log for Teseor. Anything
load-bearing — a structural choice, a rejected alternative, a public
surface change, a non-obvious constraint — lands as a numbered ADR. PR
descriptions, commit messages, Slack threads, and `.claude/handover.md`
do not count as decision records.

The `docs/ADR/README.md` document spells out when to write one, what
shape it takes, and how to modify an existing one.

## Why this and not the alternatives

- **Not PR descriptions.** PR titles and bodies vanish into search noise
  the moment the next PR lands. Future contributors hitting the same
  fork won't dig through `git log` to find why a class prefix is `t-` or
  why we ship `@teseor/contracts` separately from `@teseor/css`.
- **Not the changelog.** `CHANGELOG.md` answers "what shipped"; ADRs
  answer "why we built it this way." Both are needed; neither replaces
  the other.
- **Not the handover.** `.claude/handover.md` is per-session and
  gitignored. It's the agent's working memory, not the project's
  durable record.
- **Not RFCs.** RFCs explore proposals before a decision is made
  (`docs/RFC/`). An RFC may end up becoming an ADR — but the ADR is the
  record, not the RFC.

The ADR format is older than this project (Michael Nygard's 2011 essay,
ThoughtWorks' radar entry). Cost is low: one file per decision, ~30
lines on average. Payoff compounds: every contributor reads the index
before opening a PR on a touched surface, which removes whole categories
of "should we…?" questions from review.

## Consequences

- **The ADR README is the entry point.** Every contributor (human and
  agent) lands there before opening an ADR. Project `CLAUDE.md` already
  lists `docs/ADR/` under "Pointers."
- **Modifying an ADR requires the "Ask before" gate.** Listed in project
  `CLAUDE.md` alongside removing components / tokens / themes. ADRs are
  durable; silent rewrites destroy the record.
- **Superseding is preferred over editing.** When a decision flips, the
  old ADR's status changes to `Superseded by ADR-NNNN`; the body stays
  intact for the historical record.
- **Numbers are immutable.** ADR-0003 is forever ADR-0003 even if it's
  superseded by ADR-0042 three years later. No renumbering, no gaps
  filled.
- **The decision log starts at ADR-0001.** Pre-rewrite decisions that
  matter were re-recorded as ADRs 0001–0004 during the v0.1 rewrite. ADR
  history before that point is in `legacy/v2` and not authoritative for
  the current repo (per ADR-0001).

## References

- `docs/ADR/README.md` — the index and the writing guide.
- `CLAUDE.md` — "Ask before: Modifying ADRs" gate.