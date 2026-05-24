// `git ls-files` with the `:(glob)` pathspec gotcha baked in. A bare
// `**` in a pathspec is one-segment-only by default — `git ls-files
// 'packages/react/src/**/*.tsx'` silently returns depth-1 matches only.
// Every caller of this helper avoids that footgun.
import { execSync } from "node:child_process";

// Expand the brace alternation in `pattern` to one pattern per alternative.
// `git ls-files :(glob)…` does not understand `{a,b}` syntax — its `:(glob)`
// magic is fnmatch-style. Callers commonly write `<doublestar>/*.{ts,tsx}`
// for readability; this helper desugars that to two pathspecs. Only one
// set of braces per pattern is supported (no nesting).
export function expandBraces(pattern: string): string[] {
  const match = pattern.match(/^([^{]*)\{([^}]+)\}(.*)$/);
  if (!match) return [pattern];
  const [, head = "", body = "", tail = ""] = match;
  return body
    .split(",")
    .map((alt) => alt.trim())
    .flatMap((alt) => expandBraces(`${head}${alt}${tail}`));
}

/** List tracked files matching one or more pathspecs. Each pathspec is
 *  wrapped with `:(glob)` magic so `**` is recursive. `{a,b}` brace
 *  alternation is expanded client-side. Pathspecs that already begin with
 *  magic syntax (`:(...)…`) are passed through verbatim. */
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
