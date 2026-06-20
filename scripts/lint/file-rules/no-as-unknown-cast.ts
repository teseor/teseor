// Forbids casts to schema-owned types in test files: both the double form
// `as unknown as <SpecLikeName>` and the bare form `as <SpecLikeName>`. Both
// hide fixture drift: when a schema gains a required field, a fixture
// missing it keeps compiling — until a runtime parser refuses it deep in a
// flow. Tests should build fixtures through `SchemaName.parse(...)` so the
// schema is the gate.
//
// Scope: any file matching `*.test.ts` / `*.test.tsx` under the repo. Targets
// the *Spec / *Schema / *Fixture / *Vocabulary suffixes — names whose shape
// is owned by a schema. Legitimate double-casts for DOM internals
// (`as unknown as { matchMedia?: ... }`, `as unknown as Ref<HTMLElement>`)
// pass through. Narrow indexed access (`as Spec["events"]`,
// `as Spec[K]`) is allowed — only the bare cast `as Spec` (no following
// `[`) trips the rule.
import type { FileRule } from "../registry.ts";

// Suffixes whose target type is owned by a runtime schema — casting to one
// hides a fixture-vs-schema drift. Matches the trailing word so wrapped
// generics (`Array<Spec>`, `Partial<FlatSpec>`) still fire.
const DOUBLE_FORBIDDEN_SUFFIXES = ["Spec", "Schema", "Fixture", "Vocabulary"] as const;

// Bare casts cover a tighter set: only the schema input types whose drift
// the runtime parser can catch (`Spec`, `Vocabulary`, custom `*Schema`).
// Computed-aggregate types like `FlatSpec` / `DocsSpec` are downstream of
// the parser — casting to them in production code (e.g.
// `flattenSpec(...) as DocsSpec`) widens a typed function return rather
// than smuggling around the validator.
const BARE_FORBIDDEN_NAMES = new Set(["Spec", "Vocabulary"]);
const BARE_FORBIDDEN_SUFFIXES = ["Schema"] as const;

// `as unknown as <Identifier>` where Identifier ends with one of the suffixes.
const DOUBLE_CAST_PATTERN = /\bas\s+unknown\s+as\s+([A-Z][A-Za-z0-9_]*)\b/g;

// Bare `as <Identifier>` NOT followed by `[` (which would indicate narrow
// indexed access like `as Spec["events"]`). The `(?!\s*\[)` look-ahead
// excludes the narrow case; the `(?<!unknown\s+)` look-behind excludes the
// double-cast tail (those are already covered by `DOUBLE_CAST_PATTERN`).
const BARE_CAST_PATTERN = /(?<!unknown\s+)\bas\s+([A-Z][A-Za-z0-9_]*)\b(?!\s*\[)/g;

function doubleForbidden(name: string): boolean {
  return DOUBLE_FORBIDDEN_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

function bareForbidden(name: string): boolean {
  if (BARE_FORBIDDEN_NAMES.has(name)) return true;
  return BARE_FORBIDDEN_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

// Lines that look like imports/exports — the `as` token there is an alias,
// not a cast, and must not trip the rule.
const IMPORT_LINE = /^\s*(import|export)\b/;

export type Violation = { line: number; target: string; kind: "double" | "bare" };

/** Scan one source for `as unknown as <SchemaLikeName>` and bare
 *  `as <SchemaLikeName>` casts. Returns the line, target, and cast kind. */
export function findCastViolations(source: string): Violation[] {
  const out: Violation[] = [];
  const lines = source.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (IMPORT_LINE.test(line)) continue;
    for (const match of line.matchAll(DOUBLE_CAST_PATTERN)) {
      const target = match[1];
      if (target === undefined) continue;
      if (!doubleForbidden(target)) continue;
      out.push({ line: i + 1, target, kind: "double" });
    }
    for (const match of line.matchAll(BARE_CAST_PATTERN)) {
      const target = match[1];
      if (target === undefined) continue;
      if (!bareForbidden(target)) continue;
      out.push({ line: i + 1, target, kind: "bare" });
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
    findCastViolations(source).map(({ line, target, kind }) => ({
      line,
      message: kind === "double" ? `\`as unknown as ${target}\`` : `\`as ${target}\``,
    })),
  hint:
    "Build the fixture through the schema (`SchemaName.parse({...})`) so a missing\n" +
    "required field fails at construction, not deep in a render. If the value is\n" +
    "already typed, the cast is redundant — drop it.",
};
