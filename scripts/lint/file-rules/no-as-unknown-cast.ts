// Forbids `as unknown as <SpecLikeName>` in test files. The pattern hides
// fixture drift: when a schema gains a required field, a fixture missing it
// keeps compiling — until a runtime parser refuses it deep in a flow. Tests
// should build fixtures through `SchemaName.parse(...)` so the schema is the
// gate, or use the schema's inferred type directly without the double-cast.
//
// Scope: any file matching `*.test.ts` / `*.test.tsx` under the repo. Targets
// the *Spec / *Schema / *Fixture / *Vocabulary suffixes — names whose shape
// is owned by a schema. Legitimate double-casts for DOM internals
// (`as unknown as { matchMedia?: ... }`, `as unknown as Ref<HTMLElement>`)
// pass through.
import type { FileRule } from "../registry.ts";

// Identifier suffixes that mark a name as "schema-owned" — casting to one
// hides a fixture-vs-schema drift. Match the trailing word of the target
// type so wrapped generics (`Array<Spec>`, `Partial<FlatSpec>`) still fire.
const FORBIDDEN_SUFFIXES = ["Spec", "Schema", "Fixture", "Vocabulary"] as const;

// `as unknown as <Identifier>` where Identifier ends with one of the suffixes.
// Captures the full target identifier for the error message.
const CAST_PATTERN = /\bas\s+unknown\s+as\s+([A-Z][A-Za-z0-9_]*)\b/g;

function endsWithForbiddenSuffix(name: string): boolean {
  return FORBIDDEN_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

/** Scan one source for `as unknown as <SchemaLikeName>` casts. */
export function findCastViolations(source: string): { line: number; target: string }[] {
  const out: { line: number; target: string }[] = [];
  const lines = source.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    for (const match of line.matchAll(CAST_PATTERN)) {
      const target = match[1];
      if (target === undefined) continue;
      if (!endsWithForbiddenSuffix(target)) continue;
      out.push({ line: i + 1, target });
    }
  }
  return out;
}

/** Registry entry consumed by `scripts/lint/run.ts`. */
export const rule: FileRule = {
  kind: "file-rule",
  pathspec: ["**/*.test.ts", "**/*.test.tsx"],
  noun: "test file(s)",
  // The rule's own test file embeds the forbidden tokens as fixtures —
  // scanning it would always fail.
  accepts: (rel) => rel !== "scripts/lint/file-rules/no-as-unknown-cast.test.ts",
  run: (_file, source) =>
    findCastViolations(source).map(({ line, target }) => ({
      line,
      message: `\`as unknown as ${target}\``,
    })),
  hint:
    "Build the fixture through the schema (`SchemaName.parse({...})`) so a missing\n" +
    "required field fails at construction, not deep in a render. If the value is\n" +
    "already typed, the double-cast is redundant — drop it.",
};
