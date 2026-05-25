#!/usr/bin/env node
// `pnpm lint:spec` — the spec validator. Runs the Zod schema (shape) and the
// semantic cross-checks (token contract, examples, constraints, vocabulary,
// motion symmetry, dep cycles, `@import` allowlist, variantChoice keys) over
// every `specs/<name>.yaml`. Exits non-zero on the first failing spec.
import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { loadTokenDictionary } from "./lib/token-dictionary.ts";
import { loadTokensCss } from "./lib/tokens-css.ts";
import { loadVocabulary } from "./lib/vocabulary.ts";
import { Spec } from "./schema.ts";
import { checkDependencyCycles, type Issue, runSemanticChecks } from "./semantic-checks.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SPECS_DIR = resolve(REPO_ROOT, "specs");
const COMPONENTS_DIR = resolve(REPO_ROOT, "packages", "css", "src", "components");

async function listSpecNames(): Promise<string[]> {
  const entries = await readdir(SPECS_DIR);
  return entries
    .filter((f) => f.endsWith(".yaml") && !f.startsWith("_"))
    .map((f) => f.slice(0, -5))
    .sort();
}

async function readSpec(name: string): Promise<{ raw: unknown; specPath: string }> {
  const specPath = resolve(SPECS_DIR, `${name}.yaml`);
  const text = await readFile(specPath, "utf8");
  return { raw: parseYaml(text), specPath };
}

async function readCss(spec: { name: string; cssFile?: string }): Promise<string | undefined> {
  const relative = spec.cssFile ?? `components/${spec.name}/${spec.name}.css`;
  const cssPath = resolve(COMPONENTS_DIR, "..", relative);
  try {
    return await readFile(cssPath, "utf8");
  } catch {
    return undefined;
  }
}

function formatIssue(issue: Issue, specPath: string): string {
  const tail = issue.path === "" ? "" : ` (${issue.path})`;
  return `  ${specPath}: ${issue.message}${tail}`;
}

async function main(): Promise<void> {
  const names = await listSpecNames();
  const vocabulary = await loadVocabulary();
  const tokenDictionary = await loadTokenDictionary();
  const tokensCss = await loadTokensCss();

  const depsByName = new Map<string, string[]>();
  const errors: { name: string; specPath: string; issues: Issue[] }[] = [];

  for (const name of names) {
    const { raw, specPath } = await readSpec(name);
    const issues: Issue[] = [];

    const parsed = Spec.safeParse(raw);
    if (!parsed.success) {
      for (const z of parsed.error.issues) {
        issues.push({
          spec: name,
          path: z.path.join("."),
          message: z.message,
        });
      }
      errors.push({ name, specPath, issues });
      continue;
    }

    depsByName.set(name, parsed.data.dependencies ?? []);
    const css = await readCss({ name: parsed.data.name, cssFile: parsed.data.cssFile });
    issues.push(...runSemanticChecks(parsed.data, { css, vocabulary, tokenDictionary, tokensCss }));
    if (issues.length > 0) errors.push({ name, specPath, issues });
  }

  const cycleIssues = checkDependencyCycles({ depsByName });
  if (cycleIssues.length > 0) {
    errors.push({
      name: "<dependency graph>",
      specPath: SPECS_DIR,
      issues: cycleIssues,
    });
  }

  if (errors.length === 0) {
    process.stdout.write(`lint:spec: ${names.length} spec${names.length === 1 ? "" : "s"} ok\n`);
    return;
  }

  for (const { specPath, issues } of errors) {
    for (const issue of issues) {
      process.stderr.write(`${formatIssue(issue, specPath)}\n`);
    }
  }
  process.stderr.write(
    `\nlint:spec: ${errors.length} spec${errors.length === 1 ? "" : "s"} failed\n`,
  );
  process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`lint:spec: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
