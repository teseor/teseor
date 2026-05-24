// Enforces the root package.json script conventions: every script key follows
// the `<verb>[:<scope>]` naming pattern, and the script set stays in sync with
// the dev-scripts.md catalog — every script has a row, every row a real script.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "../../lib/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

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
  return {
    missing: scriptNames.filter((name) => !catalog.has(name)),
    orphan: [...catalog].filter((name) => !new Set(scriptNames).has(name)),
  };
}

function checkScriptCatalog(): ViolationDetail[] {
  const pkg = JSON.parse(readFileSync(resolve(REPO_ROOT, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
  const scriptNames = Object.keys(pkg.scripts ?? {});
  const catalog = catalogScriptNames(
    readFileSync(resolve(REPO_ROOT, "docs/process/dev-scripts.md"), "utf8"),
  );
  const out: ViolationDetail[] = [];
  for (const name of invalidScriptNames(scriptNames)) {
    out.push({
      file: "package.json",
      message: `\`${name}\` breaks the <verb>[:<scope>] naming pattern`,
    });
  }
  const { missing, orphan } = catalogMismatches(scriptNames, catalog);
  for (const name of missing) {
    out.push({
      file: "package.json",
      message: `\`${name}\` has no row in the dev-scripts.md catalog`,
    });
  }
  for (const name of orphan) {
    out.push({
      file: "docs/process/dev-scripts.md",
      message: `catalog lists \`${name}\`, which is not a root script`,
    });
  }
  return out;
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: ["package.json", "docs/process/dev-scripts.md"],
  run: checkScriptCatalog,
};
