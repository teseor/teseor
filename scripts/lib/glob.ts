// Minimal glob matcher for trigger gating. Supports `**` (cross-segment),
// `*` (one-segment), and `{a,b}` alternation. Globstar follows the standard
// "zero or more directories" rule: `a/**/b` matches `a/b` AND `a/x/b` AND
// `a/x/y/b`.
import { expandBraces } from "./enumerate.ts";

/** Anchored match treating `**`, `*`, and `{a,b}` as glob meta. */
export function globMatch(pattern: string, path: string): boolean {
  return expandBraces(pattern).some((p) => simpleGlobMatch(p, path));
}

function simpleGlobMatch(pattern: string, path: string): boolean {
  const re = pattern
    .replace(/[.+^$()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "::DSLASH::")
    .replace(/\*\*/g, "::DSTAR::")
    .replace(/\*/g, "[^/]*")
    .replace(/::DSLASH::/g, "(?:.*/)?")
    .replace(/::DSTAR::/g, ".*");
  return new RegExp(`^${re}$`).test(path);
}
