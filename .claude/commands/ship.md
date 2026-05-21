Squash-merge the current PR and clean up.

## Workflow

1. `gh pr view --json state,mergeable,statusCheckRollup` — confirm the PR is
   `OPEN`, `MERGEABLE`, and every required status check is `SUCCESS`.
2. Surface the result to the user. Wait for explicit confirmation before
   merging — the maintainer self-merges pre-v1.0, but the action is still
   visible-and-shared, so confirm.
3. `gh pr merge <n> --squash --delete-branch`.
4. `git checkout main && git pull origin main`.
5. Delete the local branch if it still exists.
6. Verify any linked issues auto-closed; if any are still open, comment with
   the merge commit to make the link explicit.

## Failure modes

- **Required checks not yet green**: stop. Do not merge with red or pending
  gates. If a gate is flaky, surface that to the user — do not retry the
  merge.
- **PR has merge conflicts**: rebase the branch onto current `main`
  (`git fetch origin && git rebase origin/main`), resolve conflicts, push,
  wait for CI again, and re-invoke `/ship`.
- **`gh pr merge --admin` is being requested**: this bypasses gates. Confirm
  with the user explicitly that they understand which gates are being
  bypassed and why. Never default to `--admin`.
- **Wrong PR number resolved**: when ambiguous, default to the PR opened from
  the current branch (`gh pr view`), not the most recent PR globally.
