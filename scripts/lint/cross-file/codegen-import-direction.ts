// Enforces the substrate plugin architecture's directional import rule:
// a plugin cannot import from another plugin. Plugin isolation is the
// substrate invariant — plugins compose via `core/registry.ts`, not via
// direct symbol references.
//
// Allowed cross-folder imports from `scripts/codegen/src/plugins/<name>/`:
//   - own folder (`./`, `./<sub>/`)
//   - core/ (`../../core/`, `../../../core/` from nested files)
//   - lib/ (`../../lib/`, `../../../lib/` from nested files)
//
// Disallowed:
//   - `../../<other-plugin>/...`
//   - `../../../<other-plugin>/...` (from nested files)
import { readFileSync } from "node:fs";
import { dirname, normalize, relative, resolve } from "node:path";
import { lsFiles } from "../../lib/enumerate.ts";
import { REPO_ROOT } from "../../lib/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

const PLUGIN_ROOT = "scripts/codegen/src/plugins";
const TRIGGERS = [`${PLUGIN_ROOT}/**/*.ts`] as const;

const IMPORT_RE = /\bfrom\s+["']([^"']+)["']/g;

/** The plugin folder name a file lives in, e.g. `events` for
 *  `scripts/codegen/src/plugins/events/check/index.ts`. */
export function pluginOf(relPath: string): string | undefined {
  const parts = relPath.split("/");
  const idx = parts.indexOf("plugins");
  if (idx < 0 || idx + 1 >= parts.length) return undefined;
  return parts[idx + 1];
}

/** Resolve a relative `from "..."` specifier against the importing file's
 *  directory. Returns the repo-relative path of the target, or undefined for
 *  non-relative specifiers (npm packages). */
export function resolveImport(fromFile: string, specifier: string): string | undefined {
  if (!specifier.startsWith(".")) return undefined;
  const fromAbs = resolve(REPO_ROOT, fromFile);
  const targetAbs = resolve(dirname(fromAbs), specifier);
  return relative(REPO_ROOT, normalize(targetAbs));
}

/** Returns the import specifiers extracted from a TS source. Comments and
 *  string literals embedded in code can produce false positives in pathological
 *  cases; for `scripts/codegen/src/plugins/**` the trade-off is acceptable
 *  (the directory is curated, no exotic string content). */
export function extractImports(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(IMPORT_RE)) {
    if (m[1] !== undefined) out.push(m[1]);
  }
  return out;
}

function checkPluginImportDirection(): ViolationDetail[] {
  const out: ViolationDetail[] = [];
  const files = lsFiles(TRIGGERS, REPO_ROOT);
  for (const rel of files) {
    const sourcePlugin = pluginOf(rel);
    if (sourcePlugin === undefined) continue;
    let source: string;
    try {
      source = readFileSync(resolve(REPO_ROOT, rel), "utf8");
    } catch {
      continue;
    }
    for (const specifier of extractImports(source)) {
      const target = resolveImport(rel, specifier);
      if (target === undefined) continue;
      const targetPlugin = pluginOf(target);
      if (targetPlugin === undefined) continue;
      if (targetPlugin === sourcePlugin) continue;
      out.push({
        file: rel,
        message: `imports from sibling plugin "${targetPlugin}" via \`${specifier}\` — plugins must not import each other (compose via core/registry.ts).`,
      });
    }
  }
  return out;
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: TRIGGERS,
  run: checkPluginImportDirection,
  hint:
    "Plugin isolation is the substrate architecture's invariant (ADR-0025).\n" +
    "If two plugins need shared logic, lift it to scripts/codegen/src/core/ or scripts/codegen/src/lib/.\n" +
    "If they need shared schema fragments, register them under their respective scopes — composeFragments merges them.",
};
