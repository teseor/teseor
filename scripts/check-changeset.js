#!/usr/bin/env node
// Mirrors the CI `changeset` gate (.github/workflows/ci.yml).
// Blocks `git push` when packages/ has changed against origin/main without an added .changeset/*.md.

import { execSync } from "node:child_process";

const BASE = "main";

function git(cmd) {
  return execSync(`git ${cmd}`, { encoding: "utf8" }).trim();
}

try {
  git(`fetch --quiet origin ${BASE}`);
} catch {
  // Offline / no remote — skip rather than block.
  process.exit(0);
}

const changed = git(`diff --name-only origin/${BASE}...HEAD`).split("\n").filter(Boolean);
const touchesPackages = changed.some((f) => f.startsWith("packages/"));
if (!touchesPackages) process.exit(0);

const hasChangeset = changed.some((f) => /^\.changeset\/.+\.md$/.test(f));
if (hasChangeset) process.exit(0);

process.stderr.write(
  "packages/ changed but no .changeset/*.md added.\nAdd a changeset with: pnpm changeset\n",
);
process.exit(1);
