#!/usr/bin/env node
// Dispatches every project-specific lint rule registered in
// `./registry.ts`. Lefthook invokes this once via `--all {staged_files}`;
// CI and `pnpm lint` invoke it via `--all`; a developer debugs one rule via
// `--<rulename>`.
//
// CLI:
//   node scripts/lint/run.ts                       # --all implied
//   node scripts/lint/run.ts --all                 # every registered rule
//   node scripts/lint/run.ts --<rulename>          # one rule
//   node scripts/lint/run.ts --<rulename> f1 f2    # one file-rule + explicit files
//   node scripts/lint/run.ts --list                # list registered rules
//   node scripts/lint/run.ts --help
//
// File-rules with explicit files behave like `eslint <files>`. Workspace
// and diff-aware rules ignore positional file args — they read their own
// inputs (a directory tree, a `git diff`, etc.).
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { lsFiles } from "../lib/enumerate.ts";
import { getChangedFiles } from "../lib/git.ts";
import { REPO_ROOT } from "../lib/paths.ts";
import { reportResult, type Violation } from "../lib/report.ts";
import { type Check, type ExternalCheck, type FileRule, REGISTRY } from "./registry.ts";

type ParsedArgs = {
  selectedRules: string[]; // empty = --all
  files: string[]; // positional, repo-relative
  list: boolean;
  help: boolean;
};

function parseArgs(argv: readonly string[]): ParsedArgs {
  const out: ParsedArgs = { selectedRules: [], files: [], list: false, help: false };
  let runAll = false;
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      out.help = true;
    } else if (arg === "--list") {
      out.list = true;
    } else if (arg === "--all") {
      runAll = true;
    } else if (arg.startsWith("--")) {
      out.selectedRules.push(arg.slice(2));
    } else {
      out.files.push(arg);
    }
  }
  if (runAll) out.selectedRules = [];
  // Default: --all when neither a rule flag nor positional file list is given.
  if (!runAll && out.selectedRules.length === 0 && out.files.length === 0) {
    // explicit no-op: the empty selectedRules array already means "all"
  }
  return out;
}

function printHelp(): void {
  process.stdout.write(
    [
      "node scripts/lint/run.ts                       # --all implied",
      "node scripts/lint/run.ts --all                 # every registered rule",
      "node scripts/lint/run.ts --<rulename>          # one rule",
      "node scripts/lint/run.ts --<rulename> f1 f2    # one file-rule + explicit files",
      "node scripts/lint/run.ts --list                # list registered rules",
      "node scripts/lint/run.ts --help",
      "",
    ].join("\n"),
  );
}

function printList(): void {
  const widest = Object.keys(REGISTRY).reduce((max, n) => Math.max(max, n.length), 0);
  for (const [name, rule] of Object.entries(REGISTRY)) {
    process.stdout.write(`  ${name.padEnd(widest)}  [${rule.kind}]\n`);
  }
}

/** True when at least one path in `staged` matches one of the trigger
 *  pathspecs. When `staged` is undefined the rule always runs (full sweep). */
function shouldTrigger(
  triggers: readonly string[],
  staged: readonly string[] | undefined,
): boolean {
  if (staged === undefined) return true;
  if (triggers.length === 0) return true;
  // Match each trigger as a simple glob: `**` matches anything; `*` matches
  // one segment; literal otherwise. Minimal — full pathspec semantics would
  // duplicate git's logic. The triggers we ship are coarse-grained enough
  // that this matches what lefthook would have done.
  return staged.some((s) => triggers.some((t) => globMatch(t, s)));
}

function globMatch(pattern: string, path: string): boolean {
  // Convert glob to a regex. `**` first so it's not captured by `*`.
  const re = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "::DOUBLESTAR::")
    .replace(/\*/g, "[^/]*")
    .replace(/::DOUBLESTAR::/g, ".*")
    .replace(/\{([^}]+)\}/g, (_, opts: string) => `(?:${opts.split(",").join("|")})`);
  return new RegExp(`^${re}$`).test(path);
}

function toRepoRelative(filePath: string): string {
  return relative(REPO_ROOT, resolve(REPO_ROOT, filePath));
}

function runFileRule(name: string, rule: FileRule, files: readonly string[] | undefined): number {
  // Explicit file lists (lefthook `{staged_files}`) come in with everything
  // currently staged. Filter through the rule's own pathspec so a `.md` rule
  // doesn't scan a `.ts` file (and vice versa). The full-sweep branch already
  // enumerates only matching files via `lsFiles`.
  const inputs = files === undefined ? lsFiles(rule.pathspec, REPO_ROOT) : files;
  const scoped = inputs
    .map(toRepoRelative)
    .filter((rel) => files === undefined || rule.pathspec.some((p) => globMatch(p, rel)))
    .filter((rel) => rule.accepts === undefined || rule.accepts(rel));
  const violations: Violation[] = [];
  for (const rel of scoped) {
    let source: string;
    try {
      source = readFileSync(resolve(REPO_ROOT, rel), "utf8");
    } catch {
      continue;
    }
    for (const v of rule.run(rel, source)) {
      violations.push({ file: v.file ?? rel, line: v.line, message: v.message });
    }
  }
  return reportResult({
    name,
    noun: rule.noun,
    inspected: scoped.length,
    violations,
    hint: rule.hint,
  });
}

function runExternal(
  name: string,
  check: ExternalCheck,
  staged: readonly string[] | undefined,
): number {
  // Build the command. When the check accepts files, append a file list —
  // either the staged subset (lefthook mode) or the full enumeration of the
  // check's triggers (full-sweep mode). Without `acceptsFiles`, the command
  // runs as-declared (e.g. `markdownlint-cli2` uses its own .jsonc glob).
  const parts = check.command.split(/\s+/);
  const [bin, ...args] = parts;
  if (bin === undefined) {
    process.stderr.write(`${name}: empty external command\n`);
    return 2;
  }
  const argv = [...args];
  if (check.acceptsFiles) {
    const inputs =
      staged === undefined ? lsFiles(check.triggers, REPO_ROOT) : staged.map(toRepoRelative);
    const matched =
      staged === undefined
        ? inputs
        : inputs.filter((p) => check.triggers.some((t) => globMatch(t, p)));
    if (matched.length === 0) {
      process.stdout.write(`${name}: skipped (no matching files)\n`);
      return 0;
    }
    argv.push(...matched);
  }
  const result = spawnSync(bin, argv, { stdio: "inherit", cwd: REPO_ROOT });
  if (result.status === 0) process.stdout.write(`${name}: clean\n`);
  return result.status ?? 1;
}

function runCheck(name: string, check: Check, staged: readonly string[] | undefined): number {
  if (check.kind === "file-rule") return runFileRule(name, check, staged);

  // Workspace, diff-aware, and external: gate by trigger pathspecs.
  if (!shouldTrigger(check.triggers, staged)) {
    process.stdout.write(`${name}: skipped (no matching staged files)\n`);
    return 0;
  }
  if (check.kind === "external") return runExternal(name, check, staged);
  if (check.kind === "workspace") {
    const violations: Violation[] = check.run().map((v) => ({
      file: v.file ?? "(workspace)",
      line: v.line,
      message: v.message,
    }));
    return reportResult({ name, violations, hint: check.hint });
  }
  // diff-aware
  const changed = getChangedFiles(REPO_ROOT);
  const violations: Violation[] = check
    .run(changed)
    .map((v) => ({ file: v.file ?? "(diff)", line: v.line, message: v.message }));
  return reportResult({ name, violations, hint: check.hint });
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }
  if (args.list) {
    printList();
    return;
  }

  const names = args.selectedRules.length === 0 ? Object.keys(REGISTRY) : args.selectedRules;
  const unknown = names.filter((n) => REGISTRY[n] === undefined);
  if (unknown.length > 0) {
    process.stderr.write(`run: unknown rule(s): ${unknown.join(", ")}\n`);
    process.stderr.write("Use --list to see registered rules.\n");
    process.exit(2);
  }

  // When a single rule is targeted and files are supplied, those files are
  // explicit input for that rule. When --all (multi-rule), positional files
  // act as the lefthook "staged" list — used to gate workspace/diff-aware
  // triggers and as the explicit input for file-rules.
  const staged: string[] | undefined = args.files.length > 0 ? args.files : undefined;

  let worstExit = 0;
  for (const name of names) {
    const check = REGISTRY[name];
    if (check === undefined) continue; // already screened above
    const exit = runCheck(name, check, staged);
    if (exit > worstExit) worstExit = exit;
  }
  process.exit(worstExit);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
