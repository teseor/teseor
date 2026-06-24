#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseDocument } from "yaml";

const REPO_ROOT = resolve(import.meta.dirname, "../..");
const WORKSPACE_PATH = resolve(REPO_ROOT, "pnpm-workspace.yaml");
const LOCKFILE_PATH = resolve(REPO_ROOT, "pnpm-lock.yaml");

type AuditResult = {
  redundant: string[];
  hardRequired: Array<{ name: string; reason: string }>;
  stillNeeded: string[];
};

function reinstall(): void {
  execFileSync("pnpm", ["install", "--lockfile-only"], {
    cwd: REPO_ROOT,
    stdio: "ignore",
  });
}

function resolvedVersions(lockText: string, packageName: string): Set<string> {
  // pnpm-lock.yaml emits `  packageName@version:` keys under the `packages:`
  // section. Match a real key (two-space indent + literal name + `@`).
  const matches = lockText.matchAll(new RegExp(`^  ${escapeRegex(packageName)}@([^:\\s]+):`, "gm"));
  const versions = new Set<string>();
  for (const m of matches) versions.add(m[1] ?? "");
  return versions;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function main(): void {
  const originalWorkspaceText = readFileSync(WORKSPACE_PATH, "utf8");
  const originalLockfileText = readFileSync(LOCKFILE_PATH, "utf8");
  const doc = parseDocument(originalWorkspaceText);
  const overridesNode = doc.get("overrides");
  const overrides =
    overridesNode && typeof overridesNode === "object"
      ? (doc.toJS().overrides as Record<string, string> | undefined)
      : undefined;
  const overrideNames = overrides ? Object.keys(overrides) : [];

  if (overrideNames.length === 0) {
    console.log(JSON.stringify({ redundant: [], hardRequired: [], stillNeeded: [] }));
    return;
  }

  reinstall();
  const baselineLock = readFileSync(LOCKFILE_PATH, "utf8");

  const result: AuditResult = { redundant: [], hardRequired: [], stillNeeded: [] };

  try {
    for (const name of overrideNames) {
      const trialDoc = parseDocument(originalWorkspaceText);
      trialDoc.deleteIn(["overrides", name]);
      writeFileSync(WORKSPACE_PATH, trialDoc.toString());

      try {
        reinstall();
        const trialLock = readFileSync(LOCKFILE_PATH, "utf8");
        const baseVersions = resolvedVersions(baselineLock, name);
        const trialVersions = resolvedVersions(trialLock, name);
        if (setsEqual(baseVersions, trialVersions)) {
          result.redundant.push(name);
        } else {
          result.stillNeeded.push(name);
        }
      } catch (err) {
        result.hardRequired.push({
          name,
          reason:
            err instanceof Error
              ? (err.message.split("\n")[0] ?? "install failed")
              : "install failed",
        });
      }
    }
  } finally {
    writeFileSync(WORKSPACE_PATH, originalWorkspaceText);
    writeFileSync(LOCKFILE_PATH, originalLockfileText);
    reinstall();
  }

  console.log(JSON.stringify(result));
}

main();
