Wrap up the current branch and open a PR.

## Workflow

1. Verify the working tree is clean (`git status`) and we are on a feature
   branch, not `main`.
2. Run `pnpm lint && pnpm typecheck && pnpm test:unit`. If anything fails,
   stop and surface the error — do not push a red branch.
3. If `packages/**` was touched, run `pnpm changeset` and write a one-paragraph
   entry. Skip if only tooling/docs changed (the `ci / changeset` gate enforces
   this anyway).
4. `git push -u origin HEAD` if the branch hasn't been pushed yet, else
   `git push`.
5. Open the PR with `gh pr create`. Extract the issue number from the branch
   name (`<type>/<n>-<slug>`) and pre-fill the body using the template:
   - `## What`: one-sentence summary
   - `## Why`: the why, ending with `Closes #<n>`
   - `## Test plan`: checkboxes for verifications a reviewer should do
   - `## Out of scope`: what intentionally got pushed to a follow-up issue
6. Wait until all required CI checks turn green before declaring done.

## Failure modes

- **CI fails after push**: drop into systematic debugging. Don't `--no-verify`
  or `--allow-empty` your way around hook failures.
- **Branch has commits closing more than three issues**: the PR is too wide.
  Pause, propose a split to the user.
- **No issue number in branch name**: ask the user which issue this PR closes,
  or file one with `/issue-this` first. The `pr-discipline / linked-issue`
  gate will block otherwise.
- **`packages/**` changed but no changeset**: stop and ask the user whether
  this is genuinely user-visible. If yes, write a changeset. If no, the
  changeset gate will reject the PR.
