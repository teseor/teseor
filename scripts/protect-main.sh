#!/usr/bin/env bash
# Configure the "Protect main" repository ruleset for the v0.1 required status checks.
# Idempotent: every run replaces the ruleset's rules with the canonical set defined below.
#
# Usage:
#   scripts/protect-main.sh                # operates on teseor/teseor
#   TESEOR_REPO=org/fork scripts/protect-main.sh
#
# Pre-v1.0 the maintainer self-merges; required_approving_review_count is 0.
# Bump to 1 once the v1.0 review policy lands.

set -euo pipefail

REPO="${TESEOR_REPO:-teseor/teseor}"
RULESET_NAME="Protect main"

ruleset_id="$(
  gh api "repos/${REPO}/rulesets" \
    --jq ".[] | select(.name == \"${RULESET_NAME}\") | .id"
)"

if [ -z "${ruleset_id}" ]; then
  echo "Ruleset '${RULESET_NAME}' not found on ${REPO}." >&2
  echo "Create it once via the GitHub UI, then re-run this script." >&2
  exit 1
fi

payload="$(cat <<'JSON'
{
  "name": "Protect main",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_linear_history" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["squash"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "lint" },
          { "context": "typecheck" },
          { "context": "test-unit" },
          { "context": "gen-drift" },
          { "context": "changeset" },
          { "context": "visual" },
          { "context": "linked-issue" },
          { "context": "title-format" },
          { "context": "body-sections" },
          { "context": "measure" },
          { "context": "Analyze (javascript-typescript)" }
        ]
      }
    }
  ]
}
JSON
)"

gh api -X PUT "repos/${REPO}/rulesets/${ruleset_id}" \
  --input - <<<"${payload}" \
  --jq '"Updated ruleset \"" + .name + "\" with " + (.rules | length | tostring) + " rules."'

echo "Required status checks configured for ${REPO}/main:"
echo "  ci.yml          → lint, typecheck, test-unit, gen-drift, changeset"
echo "  visual-tests    → visual"
echo "  pr-discipline   → linked-issue, title-format, body-sections (labeler is a side effect, not gated)"
echo "  size-data       → measure"
echo "  CodeQL          → Analyze (javascript-typescript)"
echo
echo "Aspirational checks not yet gated (workflows scaffolded but trigger on workflow_run, not PR):"
echo "  lighthouse / audit       — runs after deploy-docs succeeds (v0.2)"
echo "  size-report / report     — runs after size-data uploads an artifact (v0.2)"
echo "  showcase-purity          — workflow lands with the first apps/showcase-*/ in v0.4"
echo "Add these contexts to the script and re-run when each one starts firing on PRs."
