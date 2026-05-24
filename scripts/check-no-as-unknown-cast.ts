#!/usr/bin/env node
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
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");

// Identifier suffixes that mark a name as "schema-owned" — casting to one
// hides a fixture-vs-schema drift. Match the trailing word of the target
// type so wrapped generics (`Array<Spec>`, `Partial<FlatSpec>`) still fire.
const FORBIDDEN_SUFFIXES = ["Spec", "Schema", "Fixture", "Vocabulary"] as const;

// `as unknown as <Identifier>` where Identifier ends with one of the suffixes.
// Captures the full target identifier for the error message.
const CAST_PATTERN = /\bas\s+unknown\s+as\s+([A-Z][A-Za-z0-9_]*)\b/g;

type Violation = { file: string; line: number; target: string };

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

function isTestFile(path: string): boolean {
  return path.endsWith(".test.ts") || path.endsWith(".test.tsx");
}

/** The script's own test file embeds the forbidden patterns as test fixtures.
 *  Scanning it would always fail. Resolve through `relative` so both staged
 *  paths and absolute argv paths match the same string. */
function isSelfTest(path: string): boolean {
  return relative(REPO_ROOT, resolve(path)) === "scripts/check-no-as-unknown-cast.test.ts";
}

function listAllTrackedTestFiles(): string[] {
  // Lefthook passes `{staged_files}` so we normally get an explicit argv. When
  // called bare (CI, manual run), enumerate via `git ls-files` so the rule
  // covers the whole repo without picking up node_modules.
  const stdout = execSync("git ls-files '*.test.ts' '*.test.tsx'", {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((p) => resolve(REPO_ROOT, p));
}

function main(): void {
  const argv = process.argv.slice(2);
  const files = (argv.length > 0 ? argv.filter(isTestFile) : listAllTrackedTestFiles()).filter(
    (p) => !isSelfTest(p),
  );
  const violations: Violation[] = [];
  for (const file of files) {
    let source: string;
    try {
      source = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const { line, target } of findCastViolations(source)) {
      violations.push({ file: relative(REPO_ROOT, resolve(file)), line, target });
    }
  }
  if (violations.length > 0) {
    const lines = violations.map((v) => `  - ${v.file}:${v.line}  \`as unknown as ${v.target}\``);
    process.stderr.write(
      `check-no-as-unknown-cast: schema-shape double-casts in tests:\n${lines.join("\n")}\n\n` +
        "Build the fixture through the schema (`SchemaName.parse({...})`) so a missing\n" +
        "required field fails at construction, not deep in a render. If the value is\n" +
        "already typed, the double-cast is redundant — drop it.\n",
    );
    process.exit(1);
  }
  process.stdout.write(`check-no-as-unknown-cast: ${files.length} test file(s) clean\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
