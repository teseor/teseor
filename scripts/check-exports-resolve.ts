#!/usr/bin/env node
// Asserts every workspace package's `exports` map points at a path that
// exists on disk. A missing barrel (the cause of PR #707's `@teseor/contract`
// publish-time miss) is the kind of thing that compiles in every consumer
// inside the monorepo because tsconfig path resolution falls back to `src/`,
// then breaks at install time for an external package because npm honors
// `exports` strictly.
//
// Build outputs under `dist/` are checked only if the dist directory exists
// — pre-build runs would otherwise false-positive every time. The script
// reports how many dist paths it skipped so CI (which always builds first)
// still flags real misses.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");

type ExportsValue = string | null | { [condition: string]: ExportsValue };
type Exports = Record<string, ExportsValue>;
type PackageJson = { name?: string; exports?: Exports | string };

type Violation = { pkg: string; key: string; target: string };

/** Flatten a (possibly conditional) exports value to the file paths it can
 *  resolve to. `null` blocks (`"./_runtime.test": null`) are intentional
 *  denylist entries and contribute no targets. */
export function flattenExportTargets(value: ExportsValue): string[] {
  if (value === null) return [];
  if (typeof value === "string") return [value];
  const out: string[] = [];
  for (const inner of Object.values(value)) {
    out.push(...flattenExportTargets(inner));
  }
  return out;
}

/** True when the path contains a wildcard segment — wildcards resolve at
 *  consumer-import time, not statically, so the script cannot point-check
 *  them. The wildcard's parent directory is the implicit target. */
function isWildcard(p: string): boolean {
  return p.includes("*");
}

function pathExists(absolute: string): boolean {
  try {
    statSync(absolute);
    return true;
  } catch {
    return false;
  }
}

export type CheckResult = {
  violations: Violation[];
  skippedDistPaths: number;
};

/** Walk one package's `exports` map and report missing targets. */
export function checkPackageExports(pkgDir: string, pkgJson: PackageJson): CheckResult {
  const result: CheckResult = { violations: [], skippedDistPaths: 0 };
  const exportsField = pkgJson.exports;
  if (exportsField === undefined) return result;
  if (typeof exportsField === "string") {
    visit(pkgDir, pkgJson.name ?? pkgDir, ".", exportsField, result);
    return result;
  }
  for (const [key, value] of Object.entries(exportsField)) {
    if (isWildcard(key)) continue;
    visit(pkgDir, pkgJson.name ?? pkgDir, key, value, result);
  }
  return result;
}

function visit(
  pkgDir: string,
  pkgName: string,
  key: string,
  value: ExportsValue,
  result: CheckResult,
): void {
  for (const target of flattenExportTargets(value)) {
    if (isWildcard(target)) continue;
    const absolute = resolve(pkgDir, target);
    if (pathExists(absolute)) continue;
    // Skip dist paths when the dist directory hasn't been built yet — the
    // common pre-build local case. CI builds first, so real misses still
    // surface there.
    if (target.includes("/dist/") || target.startsWith("./dist/")) {
      if (!existsSync(resolve(pkgDir, "dist"))) {
        result.skippedDistPaths += 1;
        continue;
      }
    }
    result.violations.push({ pkg: pkgName, key, target });
  }
}

function listPackageJsons(): string[] {
  const out: string[] = [];
  for (const root of ["packages", "apps"]) {
    const dir = resolve(REPO_ROOT, root);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      const pkg = resolve(dir, name, "package.json");
      if (pathExists(pkg)) out.push(pkg);
    }
  }
  return out;
}

function main(): void {
  const allViolations: Violation[] = [];
  let totalSkipped = 0;
  const packages = listPackageJsons();
  for (const pkgPath of packages) {
    const pkgJson = JSON.parse(readFileSync(pkgPath, "utf8")) as PackageJson;
    const { violations, skippedDistPaths } = checkPackageExports(dirname(pkgPath), pkgJson);
    allViolations.push(...violations);
    totalSkipped += skippedDistPaths;
  }
  if (allViolations.length > 0) {
    const lines = allViolations.map(
      (v) => `  - ${v.pkg}: exports[${JSON.stringify(v.key)}] -> ${v.target}`,
    );
    process.stderr.write(
      `check-exports-resolve: ${allViolations.length} export target(s) do not exist:\n${lines.join("\n")}\n\n` +
        "Every `exports` entry must point at a file or directory present on disk.\n" +
        "Either remove the entry, fix the path, or build the package first (for dist paths).\n",
    );
    process.exit(1);
  }
  const skipNote = totalSkipped > 0 ? ` (skipped ${totalSkipped} unbuilt dist path(s))` : "";
  process.stdout.write(`check-exports-resolve: ${packages.length} package(s) clean${skipNote}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
