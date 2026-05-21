---
status: draft
proposed: YYYY-MM-DD
decided:
---

# <NNNN> — <short title>

> Copy this file to `docs/RFC/<NNNN>-<short-slug>.md`. Pick the next free
> number. Fill every section. "Unresolved questions" can be substantive —
> RFCs land in `status: draft` and graduate as the design firms up.
>
> Delete this blockquote before opening the PR.

## Summary

One paragraph. What is the proposal? Plain prose, no jargon a first-time
reader of this repo wouldn't recognize. If you can't summarize the proposal
in a paragraph, the proposal is two RFCs.

## Motivation

The concrete problem this RFC exists to solve.

- Who hit it? (a contributor, a consumer, a specific component, CI, the
  release pipeline)
- What does the current state cost them? Lost time, wrong output, blocked
  work, surprising behavior — be specific.
- Why can't the existing process or tooling handle it?

"We should be more consistent" is not motivation. "Three contributors in
the last quarter wrote `.t-btn` instead of `.t-button` because the docs
example shows the old name" is motivation.

## Detailed design

The proposal in full. Anyone reading just this section should be able to
implement the RFC without asking follow-up questions.

Cover, where relevant:

- The shape of the change — new file, new field on an existing schema,
  new package, new CI gate.
- Examples of the new shape in use. Use real component names, real prop
  names, real tokens — not `Foo` and `bar`.
- How the change interacts with existing rules and tooling. Which lint
  rules need updating, which validators need new clauses, which CI gates
  need to know about the change.
- What "done" looks like — what files exist, what tests pass, what error
  messages a contributor or consumer sees in the new world.

Prefer code blocks and tables over prose where they fit. The detailed
design is reference material; it gets re-read whenever someone
implements or audits the RFC.

## Drawbacks

Why might we not want to do this?

Be honest. Every RFC has drawbacks; an RFC with no listed drawbacks hasn't
been thought through. Examples of real drawbacks:

- Adds a new tool with its own learning curve.
- Increases the time-to-first-contribution for newcomers.
- Couples two parts of the system that were previously independent.
- Costs bundle size, build time, or CI minutes.
- Conflicts with a probable future change (name a specific one).

If the drawbacks outweigh the motivation, the RFC should be rejected, not
patched until the section is empty.

## Alternatives

List at least one realistic alternative that was considered and rejected.
"Do nothing" is always an alternative; in many RFCs it's the right one,
which is why the section is mandatory.

Each alternative gets a paragraph: what would it look like, what does it
cost, why is it weaker than the proposal? "We considered using X but
decided not to" is not enough — say what X would have meant in practice
and what specifically tipped the decision the other way.

## Adoption strategy

What does this change look like for someone using Teseor today?

- Migration window — does this require a major bump? A deprecation cycle?
  None of the above (additive)?
- Codemod — does the change ship a codemod? If not, why is it
  judgment-required rather than mechanical? (See
  `process/versioning.md` § "Codemods".)
- Default vs opt-in — does the change become the default immediately, or
  is there a phase where consumers opt in by setting a flag, an attribute,
  or an import path?
- Backwards compatibility — what consumer code keeps working unchanged?
  What breaks?

If "no consumers are affected, this is repo-internal," say so explicitly.
That's a valid adoption story.

## Unresolved questions

Open questions the RFC doesn't answer. Be specific:

- Names that aren't finalized.
- Edge cases the design might not handle.
- Decisions deferred to implementation.
- Things you'd like reviewer input on before promoting to `proposed`.

It's fine for this section to be long while the RFC is in `draft`. By the
time the RFC is `accepted`, every question here should be resolved or
moved into a follow-up RFC.

## What this doesn't propose

Bound the scope. List adjacent ideas the RFC is *not* trying to settle so
reviewers don't argue about them in the PR thread:

- "This RFC doesn't change the existing `--t-*` token naming."
- "This RFC doesn't address Vue/Svelte parity — that's tracked separately."
- "This RFC doesn't propose tooling changes; if accepted, the validator
  update is a follow-up PR."

A bounded RFC lands. An unbounded one accumulates objections.

## Lifecycle reminder

- `draft` — opened for discussion. The PR adds the file in `draft`.
- `proposed` — design is stable; ready for a final pass before implementation.
- `accepted` — implementation has landed (or is landing in the same PR for
  small RFCs). `decided:` is filled in.
- `rejected` — closed without implementation. Kept in `docs/RFC/` so the
  reasoning survives.
- `superseded` — replaced by a later RFC. Cross-link to the replacement in
  the frontmatter.

Files are kept on every terminal state. The reasoning is the artifact,
not the outcome.
