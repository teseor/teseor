File a GitHub issue for a mid-session TODO. Argument: a one-line description.

## Workflow

1. Draft a title and body from the description:
   - Title: `<type>: <subject>` matching the same prefixes the project uses
     (`feat`, `fix`, `chore`, `docs`, `test`).
   - Body sections: `## What` (1 sentence), `## Why` (1 paragraph),
     `## Acceptance` (checkbox list), `## Out of scope` (optional).
2. Show the draft to the user and ask for confirmation. Adjust on feedback.
3. Pick the appropriate `type:*` and `area:*` labels — read
   `.github/labels.yml` for the canonical set.
4. `gh issue create --title "..." --body "..." --label "type:..." --label "area:..."`.
5. If invoked from a working branch, add a comment on the new issue linking
   to the current branch so the connection is discoverable.
6. Surface the issue URL to the user.

## Failure modes

- **Description is too vague to draft a sensible title**: ask the user one
  clarifying question before drafting. Never file empty placeholder issues.
- **Existing issue covers the same scope**: search first with
  `gh issue list --search "<keywords>"`. If a match exists, comment on it
  instead of filing a duplicate.
- **No matching milestone or label exists**: file the issue without one and
  surface that gap to the user — do not silently create new labels.
- **User declines the draft**: discard the draft. Do not file a partial
  version "to revise later".
