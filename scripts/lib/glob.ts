// Minimal glob matcher used for lefthook-trigger gating. Supports `**`
// (cross-segment), `*` (one-segment), and `{a,b}` alternation. Not a full
// pathspec implementation — the triggers shipped in `scripts/lint/registry.ts`
// are deliberately coarse-grained so this matcher stays small.
//
// Why this lives in `lib/` instead of being inlined in the runner: the
// original inline version escaped `{`/`}` before substituting alternation,
// so any pattern with braces (`**/*.{ts,tsx}`, `{packages,apps}/*/package.json`)
// silently never matched. Tests for the brace cases were the safeguard that
// would have caught it pre-merge.
import { expandBraces } from "./enumerate.ts";

/** True iff `path` matches `pattern` treating `**`, `*`, and `{a,b}` as
 *  glob meta. The match is anchored — no partial matches. */
export function globMatch(pattern: string, path: string): boolean {
  return expandBraces(pattern).some((p) => simpleGlobMatch(p, path));
}

// Match without brace expansion — caller is responsible for desugaring
// `{a,b}` via `expandBraces` if the pattern has alternation.
//
// Globstar semantics: a leading `<doublestar>/x` matches `x` AND `a/x` AND
// `a/b/x`. To get that, convert `<doublestar>/` (with trailing slash) to
// `(?:.*/)?` so the "zero directories" case (`packages/a.ts` against
// `packages/<doublestar>/*.ts`) still matches. Standalone `<doublestar>`
// (no slash) becomes `.*`. Then `*` becomes `[^/]*` for single-segment
// matches.
function simpleGlobMatch(pattern: string, path: string): boolean {
  // Order matters: regex-escape FIRST so literal punctuation doesn't
  // collide with the regex meta we introduce next. Then process the
  // doublestar-slash, doublestar, and single-star tokens in that order so
  // each transform sees the right input.
  const re = pattern
    .replace(/[.+^$()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "::DSLASH::")
    .replace(/\*\*/g, "::DSTAR::")
    .replace(/\*/g, "[^/]*")
    .replace(/::DSLASH::/g, "(?:.*/)?")
    .replace(/::DSTAR::/g, ".*");
  return new RegExp(`^${re}$`).test(path);
}
