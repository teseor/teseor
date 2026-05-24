#!/usr/bin/env bash
# Local pre-flight code review against the current branch's diff.
# Sends `git diff $BASE...HEAD` to a GitHub Models endpoint via the `gh-models`
# extension with the project's review prompt. Prints suggestions to stdout.
#
# Exit codes:
#   0  diff empty, or review completed (regardless of what the review said).
#   1  missing prerequisite (gh CLI, gh-models extension, prompt file).
#   *  underlying `gh models run` failure (network, auth, rate limit).
#
# Requires: `gh` CLI + `gh-models` extension. Installation hints emit below.
set -euo pipefail

if ! command -v gh > /dev/null 2>&1; then
  printf 'review: gh CLI not installed (https://cli.github.com/)\n' >&2
  exit 1
fi

if ! gh extension list 2>/dev/null | grep -q 'github/gh-models\|gh models'; then
  printf 'review: gh-models extension missing. Install with:\n' >&2
  printf '  gh extension install github/gh-models\n' >&2
  exit 1
fi

BASE="${BASE:-origin/main}"
MODEL="${MODEL:-openai/gpt-4o}"

if ! git rev-parse "$BASE" > /dev/null 2>&1; then
  printf 'review: base ref %s not resolvable; fetching origin main...\n' "$BASE" >&2
  git fetch --quiet origin main
  if ! git rev-parse "$BASE" > /dev/null 2>&1; then
    printf 'review: base ref %s still not resolvable after fetch — set BASE to a reachable ref\n' "$BASE" >&2
    exit 1
  fi
fi

DIFF=$(git diff "$BASE"...HEAD)
if [ -z "$DIFF" ]; then
  printf 'review: no diff against %s — nothing to review\n' "$BASE"
  exit 0
fi

LINES=$(printf '%s\n' "$DIFF" | wc -l | tr -d ' ')
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/review-prompt.md"
if [ ! -f "$PROMPT_FILE" ]; then
  printf 'review: prompt file missing at %s\n' "$PROMPT_FILE" >&2
  exit 1
fi
PROMPT=$(cat "$PROMPT_FILE")

printf 'review: sending %s lines of diff to %s via gh-models...\n\n' "$LINES" "$MODEL" >&2
# `gh models run` reads the user-message from stdin and the system prompt from $1.
printf '%s\n' "$DIFF" | gh models run "$MODEL" "$PROMPT"
