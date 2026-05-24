#!/usr/bin/env bash
# Local Copilot-style pre-flight code review using `gh-models`.
# Sends the current branch's diff (against $BASE, default origin/main) to a
# GitHub Models LLM with the project's review prompt. Prints suggestions and
# exits 0 — opinions only, no blocking.
#
# Requires: gh CLI + gh-models extension (free under a paid Copilot plan).
# Install hints surface inline below.
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
  printf 'review: base ref %s not resolvable; running `git fetch origin main` first...\n' "$BASE" >&2
  git fetch --quiet origin main
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
