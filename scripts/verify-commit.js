#!/usr/bin/env node
// Conventional-commit verifier called from lefthook commit-msg.
// Port of Vue's scripts/verify-commit.js — kept intentionally small.

import { readFileSync } from "node:fs";

const msgPath = process.argv[2];
if (!msgPath) {
  console.error("Usage: verify-commit.js <path-to-commit-msg-file>");
  process.exit(1);
}

const firstLine = readFileSync(msgPath, "utf8").split("\n")[0].trim();

if (/^(Merge|Revert)\s/.test(firstLine)) process.exit(0);

const pattern = /^(feat|fix|perf|refactor|docs|chore|test)\([a-z0-9-]+\): .+/;

if (!pattern.test(firstLine)) {
  console.error("");
  console.error("Invalid commit message format.");
  console.error("Expected: type(scope): subject");
  console.error("");
  console.error("Examples:");
  console.error("  feat(button): add loading state");
  console.error("  chore(repo): bump lefthook to 1.7");
  console.error("  fix(css): resolve focus-visible regression");
  console.error("");
  console.error("Allowed types: feat, fix, perf, refactor, docs, chore, test");
  console.error("Allowed scopes: lowercase alphanumeric + dashes");
  console.error("");
  console.error(`Got: "${firstLine}"`);
  console.error("");
  process.exit(1);
}
