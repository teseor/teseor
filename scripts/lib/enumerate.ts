// `git ls-files` wrapped with `:(glob)` so `**` is cross-segment. Without
// the magic prefix, a bare `**` in a pathspec matches one segment only —
// `git ls-files 'packages/react/src/**/*.tsx'` silently returns nothing.
import { execSync } from "node:child_process";

/** Expand `{a,b}` alternation client-side; git pathspec doesn't. One brace
 *  set per pattern (no nesting). */
export function expandBraces(pattern: string): string[] {
  const match = pattern.match(/^([^{]*)\{([^}]+)\}(.*)$/);
  if (!match) return [pattern];
  const [, head = "", body = "", tail = ""] = match;
  return body
    .split(",")
    .map((alt) => alt.trim())
    .flatMap((alt) => expandBraces(`${head}${alt}${tail}`));
}

/** Tracked files matching the pathspecs. `:(glob)` is prepended unless the
 *  pathspec already declares its own magic prefix. */
export function lsFiles(pathspecs: readonly string[], cwd: string): string[] {
  const expanded = pathspecs.flatMap((p) => (p.startsWith(":(") ? [p] : expandBraces(p)));
  const args = expanded
    .map((p) => (p.startsWith(":(") ? p : `:(glob)${p}`))
    .map((p) => `'${p.replace(/'/g, `'\\''`)}'`)
    .join(" ");
  const stdout = execSync(`git ls-files ${args}`, { cwd, encoding: "utf8" });
  return stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}
