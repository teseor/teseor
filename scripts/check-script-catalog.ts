#!/usr/bin/env node
// Enforces the root package.json script conventions: every script key follows
// the `<verb>[:<scope>]` naming pattern, and the script set stays in sync with
// the dev-scripts.md catalog — every script has a row, every row a real script.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const NAME_PATTERN = /^[a-z][a-z0-9]*(?::[a-z][a-z0-9-]*)*$/;

/** Script keys that break the `<verb>[:<scope>]` naming pattern. */
export function invalidScriptNames(names: readonly string[]): string[] {
  return names.filter((name) => !NAME_PATTERN.test(name));
}

/** Base script names referenced by the dev-scripts.md catalog table. */
export function catalogScriptNames(markdown: string): Set<string> {
  const names = new Set<string>();
  for (const match of markdown.matchAll(/^\|\s*`pnpm ([a-z][\w:-]*)/gm)) {
    if (match[1] !== undefined) {
      names.add(match[1]);
    }
  }
  return names;
}

/**
 * Compares the package.json script set with the catalog. `missing` lists
 * scripts with no catalog row; `orphan` lists catalog rows with no script.
 */
export function catalogMismatches(
  scriptNames: readonly string[],
  catalog: ReadonlySet<string>,
): { missing: string[]; orphan: string[] } {
  const scripts = new Set(scriptNames);
  return {
    missing: scriptNames.filter((name) => !catalog.has(name)),
    orphan: [...catalog].filter((name) => !scripts.has(name)),
  };
}

function main(): void {
  const repoRoot = resolve(import.meta.dirname, "..");
  const pkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
  const scriptNames = Object.keys(pkg.scripts ?? {});
  const catalog = catalogScriptNames(
    readFileSync(resolve(repoRoot, "docs/process/dev-scripts.md"), "utf8"),
  );

  const problems: string[] = [];
  for (const name of invalidScriptNames(scriptNames)) {
    problems.push(`\`${name}\` breaks the <verb>[:<scope>] naming pattern`);
  }
  const { missing, orphan } = catalogMismatches(scriptNames, catalog);
  for (const name of missing) {
    problems.push(`\`${name}\` has no row in the dev-scripts.md catalog`);
  }
  for (const name of orphan) {
    problems.push(`the dev-scripts.md catalog lists \`${name}\`, which is not a root script`);
  }

  if (problems.length > 0) {
    console.error(`Script catalog problems:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`check-script-catalog: ${scriptNames.length} scripts named and catalogued`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
