// Fails when a root package.json script delegates work with `pnpm -r ... run <X>`
// to a per-package script that no workspace package implements. `--if-present`
// turns such a dead aggregator into a silent success, so nothing else catches it.
import { globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "../helpers/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

type PackageJson = { scripts?: Record<string, string> };

/** Script names a command hands to `pnpm -r` / `pnpm --recursive`. */
export function extractRecursiveTargets(command: string): string[] {
  const targets: string[] = [];
  const pattern = /pnpm\b[^&|;]*?(?<=\s)(?:-r|--recursive)(?=\s)[^&|;]*?\brun\s+(\S+)/g;
  for (const match of command.matchAll(pattern)) {
    if (match[1] !== undefined) {
      targets.push(match[1]);
    }
  }
  return targets;
}

/**
 * Aggregator targets in `rootScripts` that no entry of `implemented` provides.
 * Each returned string names the offending root script and its dead target.
 */
export function findDeadAggregators(
  rootScripts: Record<string, string>,
  implemented: ReadonlySet<string>,
): string[] {
  const dead: string[] = [];
  for (const [scriptName, command] of Object.entries(rootScripts)) {
    for (const target of extractRecursiveTargets(command)) {
      if (!implemented.has(target)) {
        dead.push(
          `\`${scriptName}\` delegates to \`pnpm -r run ${target}\` — no workspace package defines a \`${target}\` script`,
        );
      }
    }
  }
  return dead;
}

/** The `packages:` globs declared in a pnpm-workspace.yaml body. */
export function workspacePatterns(yamlText: string): string[] {
  const patterns: string[] = [];
  let inPackages = false;
  for (const line of yamlText.split("\n")) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }
    if (!inPackages) {
      continue;
    }
    const item = line.match(/^\s+-\s+['"]?([^'"]+?)['"]?\s*$/);
    if (item?.[1] !== undefined) {
      patterns.push(item[1]);
    } else if (/^\S/.test(line)) {
      break;
    }
  }
  return patterns;
}

function readPackageJson(file: string): PackageJson {
  return JSON.parse(readFileSync(file, "utf8")) as PackageJson;
}

function checkAggregators(): ViolationDetail[] {
  const rootPkg = readPackageJson(resolve(REPO_ROOT, "package.json"));
  const patterns = workspacePatterns(
    readFileSync(resolve(REPO_ROOT, "pnpm-workspace.yaml"), "utf8"),
  );
  const implemented = new Set<string>();
  for (const rel of globSync(
    patterns.map((pattern) => `${pattern}/package.json`),
    { cwd: REPO_ROOT },
  )) {
    const pkg = readPackageJson(resolve(REPO_ROOT, rel));
    for (const name of Object.keys(pkg.scripts ?? {})) {
      implemented.add(name);
    }
  }
  return findDeadAggregators(rootPkg.scripts ?? {}, implemented).map((message) => ({
    file: "package.json",
    message,
  }));
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: ["**/package.json", "pnpm-workspace.yaml"],
  run: checkAggregators,
};
