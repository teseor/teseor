#!/usr/bin/env node
// Conventional-commit verifier called from lefthook commit-msg.
// Reads the same scope vocabulary the CI `title-format` gate uses, so a
// commit that passes locally also passes on the PR title check.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const scopesFile = resolve(repoRoot, ".github/commit-scopes.txt");
const specsDir = resolve(repoRoot, "specs");

const msgPath = process.argv[2];
if (!msgPath) {
  console.error("Usage: commit-msg.js <path-to-commit-msg-file>");
  process.exit(1);
}

const firstLine = readFileSync(msgPath, "utf8").split("\n")[0].trim();

if (/^(Merge|Revert)\s/.test(firstLine)) process.exit(0);

const fixedScopes = readFileSync(scopesFile, "utf8")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const componentScopes = readdirSync(specsDir)
  .filter((name) => name.endsWith(".yaml") && name !== "_vocabulary.yaml")
  .map((name) => name.replace(/\.yaml$/, ""));

const scopes = [...new Set([...fixedScopes, ...componentScopes])].sort();
const pattern = new RegExp(
  `^(feat|fix|perf|refactor|docs|chore|test)\\((${scopes.join("|")})\\): .+`,
);

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
  console.error(`Allowed scopes: ${scopes.join(", ")}`);
  console.error("");
  console.error(`Got: "${firstLine}"`);
  console.error("");
  process.exit(1);
}
