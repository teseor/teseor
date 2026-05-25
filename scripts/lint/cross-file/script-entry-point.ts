// Every `node scripts/<x>.ts` invocation in `.github/workflows/*.yml`,
// `.claude/settings.json`, `package.json`, and `lefthook.yml` must target a
// file that actually runs when invoked. A lint rule file (exports `rule`, no
// `main()`, no entry-point guard) silently no-ops when run directly — the
// regression that motivated this check after #731.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { lsFiles } from "../../lib/enumerate.ts";
import { REPO_ROOT } from "../../lib/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

const CONFIG_FILES = [".claude/settings.json", "package.json", "lefthook.yml"] as const;
const WORKFLOW_PATHSPEC = ".github/workflows/*.yml";

const TRIGGERS = [...CONFIG_FILES, WORKFLOW_PATHSPEC] as const;

// The unified dispatcher: its entry point lives in `main()` guarded by
// `process.argv[1] === fileURLToPath(import.meta.url)`. Allowlisted so the
// heuristic doesn't need to chase that exact shape.
const DISPATCHER = "scripts/lint/run.ts";

/** Targets of `node <path>` invocations (`<path>` starts with `scripts/`).
 *  Trailing punctuation from quoting / permission patterns is stripped. */
export function extractInvocations(source: string): string[] {
  const out = new Set<string>();
  for (const match of source.matchAll(/\bnode\s+(scripts\/[\w./-]+)/g)) {
    const raw = match[1] ?? "";
    const trimmed = raw.replace(/[.,)*:"]+$/, "");
    if (trimmed.length > "scripts/".length) out.add(trimmed);
  }
  return [...out];
}

/** A TS file is "import-only" if it has no `process.argv` / `import.meta`
 *  reference and no top-level call expression. Heuristic — false negatives
 *  are acceptable; the goal is catching the obvious regression where a file
 *  exports `rule` and runs nothing on direct invocation. */
export function isImportOnly(source: string): boolean {
  // Strip comments first: a JSDoc line mentioning `process.argv` (this very
  // file does) would otherwise mask an import-only body.
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  if (stripped.includes("process.argv")) return false;
  if (stripped.includes("import.meta")) return false;
  // Line at column 0 beginning with an identifier (optionally `.foo` chains)
  // followed by `(`, or with top-level `await`. Excludes leading keywords
  // that take parens but aren't calls (`if`, `for`, `function`, etc.).
  const TOP_LEVEL_CALL =
    /^(?!(?:import|export|function|class|const|let|var|if|for|while|switch|try|do|type|interface|enum|abstract|declare|namespace|module|return|throw|else|finally|catch)\b)([a-zA-Z_$][\w$]*(?:\.[\w$]+)*\s*\(|await\s)/m;
  return !TOP_LEVEL_CALL.test(stripped);
}

function listConfigFiles(): string[] {
  const out: string[] = [];
  for (const rel of CONFIG_FILES) {
    if (existsSync(resolve(REPO_ROOT, rel))) out.push(rel);
  }
  out.push(...lsFiles([WORKFLOW_PATHSPEC], REPO_ROOT));
  return out;
}

function checkScriptEntryPoint(): ViolationDetail[] {
  const out: ViolationDetail[] = [];
  for (const rel of listConfigFiles()) {
    let source: string;
    try {
      source = readFileSync(resolve(REPO_ROOT, rel), "utf8");
    } catch {
      continue;
    }
    for (const target of extractInvocations(source)) {
      if (target === DISPATCHER) continue;
      if (!target.endsWith(".ts")) continue;
      const abs = resolve(REPO_ROOT, target);
      if (!existsSync(abs)) continue; // config-paths reports missing targets across the same surfaces
      let body: string;
      try {
        body = readFileSync(abs, "utf8");
      } catch {
        continue;
      }
      if (isImportOnly(body)) {
        out.push({
          file: rel,
          message: `\`node ${target}\` invokes an import-only TS file; the step will silently no-op.`,
        });
      }
    }
  }
  return out;
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: TRIGGERS,
  run: checkScriptEntryPoint,
  hint:
    "Either add an entry-point guard / top-level call to the script, " +
    "dispatch it via `node scripts/lint/run.ts --<rule>`, or remove the invocation.",
};
