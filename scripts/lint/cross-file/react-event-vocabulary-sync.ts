// The spec-time vocabulary `REACT_EVENT_VOCABULARY` in
// `scripts/codegen/src/lib/react-events.ts` must match the keys of
// `EVENT_TO_HANDLER` in `packages/react/src/hooks/useOverlay.ts`. The
// validator and the runtime hook each own their own literal; this check
// is the gate that keeps them in lockstep. See #663.
//
// Order is irrelevant — both lists are compared as sorted sets. Cosmetic
// reordering on either side passes; addition or removal on one side
// without the other fails.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "../../lib/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

const VOCAB_FILE = "scripts/codegen/src/lib/react-events.ts";
const HOOK_FILE = "packages/react/src/hooks/useOverlay.ts";

/** Parse `REACT_EVENT_VOCABULARY = [...] as const` and return its string
 *  literals sorted. Returns `undefined` when the block can't be located —
 *  the orchestrator surfaces that as a "could not parse" violation rather
 *  than crashing the pipeline. */
export function parseVocabulary(source: string): string[] | undefined {
  const blockRe = /export\s+const\s+REACT_EVENT_VOCABULARY\s*=\s*\[([\s\S]*?)\]\s*as\s+const/;
  const block = source.match(blockRe);
  if (!block || block[1] === undefined) return undefined;
  return extractStringLiterals(block[1]).sort();
}

/** Parse the keys of `EVENT_TO_HANDLER: Record<string, string> = { … }`
 *  and return them sorted. Accepts quoted or bare identifier keys. */
export function parseHandlerKeys(source: string): string[] | undefined {
  const blockRe = /const\s+EVENT_TO_HANDLER[^=]*=\s*\{([\s\S]*?)\}\s*;/;
  const block = source.match(blockRe);
  if (!block || block[1] === undefined) return undefined;
  const keys = new Set<string>();
  // Quoted keys: "name": ...  or  'name': ...
  for (const m of block[1].matchAll(/["']([A-Za-z_$][\w$]*)["']\s*:/g)) {
    if (m[1]) keys.add(m[1]);
  }
  // Bare-identifier keys: name: ...  (must precede a colon, not after one)
  for (const m of block[1].matchAll(/(?:^|[,{\s])([A-Za-z_$][\w$]*)\s*:/g)) {
    if (m[1]) keys.add(m[1]);
  }
  return [...keys].sort();
}

/** Pure comparator: given two sorted lists, return one violation per
 *  member that exists in only one of the two. */
export function diffVocabularies(
  vocab: readonly string[],
  handler: readonly string[],
): { onlyInVocab: string[]; onlyInHandler: string[] } {
  const vSet = new Set(vocab);
  const hSet = new Set(handler);
  return {
    onlyInVocab: vocab.filter((n) => !hSet.has(n)),
    onlyInHandler: handler.filter((n) => !vSet.has(n)),
  };
}

function checkReactEventVocabularySync(): ViolationDetail[] {
  const out: ViolationDetail[] = [];
  let vocabSource: string;
  let hookSource: string;
  try {
    vocabSource = readFileSync(resolve(REPO_ROOT, VOCAB_FILE), "utf8");
  } catch {
    return [{ file: VOCAB_FILE, message: "file not readable" }];
  }
  try {
    hookSource = readFileSync(resolve(REPO_ROOT, HOOK_FILE), "utf8");
  } catch {
    return [{ file: HOOK_FILE, message: "file not readable" }];
  }
  const vocab = parseVocabulary(vocabSource);
  if (vocab === undefined) {
    out.push({
      file: VOCAB_FILE,
      message: "could not locate `export const REACT_EVENT_VOCABULARY = [...] as const`",
    });
  }
  const handler = parseHandlerKeys(hookSource);
  if (handler === undefined) {
    out.push({
      file: HOOK_FILE,
      message: "could not locate `const EVENT_TO_HANDLER = { … }`",
    });
  }
  if (vocab === undefined || handler === undefined) return out;
  const { onlyInVocab, onlyInHandler } = diffVocabularies(vocab, handler);
  for (const name of onlyInVocab) {
    out.push({
      file: VOCAB_FILE,
      message: `'${name}' is in REACT_EVENT_VOCABULARY but not in EVENT_TO_HANDLER (${HOOK_FILE})`,
    });
  }
  for (const name of onlyInHandler) {
    out.push({
      file: HOOK_FILE,
      message: `'${name}' is a key of EVENT_TO_HANDLER but not in REACT_EVENT_VOCABULARY (${VOCAB_FILE})`,
    });
  }
  return out;
}

/** Extract `"…"`-style string literals from a slice. Plain comma-separated
 *  array body; nested structures aren't expected. */
function extractStringLiterals(slice: string): string[] {
  const out: string[] = [];
  for (const m of slice.matchAll(/"([^"\\]*)"/g)) {
    if (m[1]) out.push(m[1]);
  }
  return out;
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: [VOCAB_FILE, HOOK_FILE],
  run: checkReactEventVocabularySync,
  hint:
    "REACT_EVENT_VOCABULARY (validator) and EVENT_TO_HANDLER (runtime hook)\n" +
    "must stay in lockstep. Add or remove an event in BOTH files.",
};
