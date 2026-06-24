// Project-specific lint rule registry. Every check that's not Biome,
// stylelint, markdownlint, or the spec validator lives here and is
// dispatched by `scripts/lint/run.ts`.
//
// Adding a check:
//   1. Implement the check function (pure function preferred, or wrap an
//      existing main() body).
//   2. Add an entry below keyed by the rule name (kebab-case).
//   3. Done — the runner picks it up automatically; lefthook is wired once
//      via `--all`; the catalog updates via the lint:project alias.
//
// No package.json edit, no lefthook edit, no new top-level script.

import { rule as codegenImportDirection } from "./cross-file/codegen-import-direction.ts";
import { rule as configPaths } from "./cross-file/config-paths.ts";
import { rule as contractSnapshots } from "./cross-file/contract-snapshots.ts";
import { rule as docPaths } from "./cross-file/doc-paths.ts";
import { rule as dogfood } from "./cross-file/dogfood.ts";
import { rule as exportsResolve } from "./cross-file/exports-resolve.ts";
import { rule as labelSync } from "./cross-file/label-sync.ts";
import { rule as scriptAggregators } from "./cross-file/script-aggregators.ts";
import { rule as scriptCatalog } from "./cross-file/script-catalog.ts";
import { rule as scriptEntryPoint } from "./cross-file/script-entry-point.ts";
import { rule as changeset } from "./diff-aware/changeset.ts";
import { rule as codegenTests } from "./diff-aware/codegen-tests.ts";
import { rule as componentCss } from "./file-rules/component-css.ts";
import { rule as motionScale } from "./file-rules/motion-scale.ts";
import { rule as noAsUnknownCast } from "./file-rules/no-as-unknown-cast.ts";
import { rule as noDocumentTypeof } from "./file-rules/no-document-typeof.ts";
import { rule as rhythmTokens } from "./file-rules/rhythm-tokens.ts";
import { rule as transitionableProperty } from "./file-rules/transitionable-property.ts";

export type ViolationDetail = { file?: string; line?: number; message: string };

/** A per-file scanner. The runner enumerates the rule's `pathspec`, reads
 *  each file, and calls `run(file, source)` once per file. Pure: no side
 *  effects, no FS access in the rule body — that's the runner's job. */
export type FileRule = {
  kind: "file-rule";
  /** Pathspec(s) the rule applies to — passed to `git ls-files :(glob)…`. */
  pathspec: readonly string[];
  /** Pre-filter on relative path. Default: accept all matched files. */
  accepts?: (relPath: string) => boolean;
  /** Singular noun for the success line ("N test file(s) clean"). */
  noun: string;
  run: (file: string, source: string) => readonly ViolationDetail[];
  /** Optional multi-line hint appended after a non-empty violation list. */
  hint?: string;
};

/** A workspace invariant — the rule walks whatever it needs (multiple
 *  package.jsons, a directory tree, etc.) and returns its own violation
 *  list. The runner provides only orchestration and reporting. */
export type WorkspaceCheck = {
  kind: "workspace";
  /** Lefthook-trigger pathspec(s). The runner skips this rule when no
   *  staged file matches any of these. Empty means "always run". */
  triggers: readonly string[];
  run: () => readonly ViolationDetail[];
  hint?: string;
};

/** A diff-aware check — reads `git diff` against the PR base and reasons
 *  over the changed file set. */
export type DiffAwareCheck = {
  kind: "diff-aware";
  triggers: readonly string[];
  run: (changedFiles: readonly string[]) => readonly ViolationDetail[];
  hint?: string;
};

/** An external command — a check that lives outside the TS registry (a `.js`
 *  helper that takes its own argv; a third-party validator). The runner
 *  shells out, optionally appending staged files, and forwards the exit
 *  code. No output reformatting: the external tool's own messages stand. */
export type ExternalCheck = {
  kind: "external";
  triggers: readonly string[];
  /** Shell command to run, e.g. `node scripts/lint/file-rules/logical-naming.js`. */
  command: string;
  /** When true, the runner appends the staged file list as positional args. */
  acceptsFiles?: boolean;
  hint?: string;
};

export type Check = FileRule | WorkspaceCheck | DiffAwareCheck | ExternalCheck;

export const REGISTRY: Readonly<Record<string, Check>> = {
  // External tools wired through the registry so `--list` and `pnpm lint`
  // are the single catalog. Each runs as its own subprocess; its native
  // output (Biome's pretty errors, etc.) is forwarded unchanged.
  biome: {
    kind: "external",
    triggers: ["**/*.{ts,tsx,js,mjs,cjs,json}"],
    command: "pnpm exec biome check --no-errors-on-unmatched --files-ignore-unknown=true",
    acceptsFiles: true,
  },
  stylelint: {
    kind: "external",
    triggers: ["packages/**/*.css"],
    command: "pnpm exec stylelint --allow-empty-input",
    acceptsFiles: true,
  },
  markdown: {
    kind: "external",
    triggers: ["**/*.md"],
    command: "pnpm exec markdownlint-cli2",
  },
  spec: {
    kind: "external",
    triggers: ["specs/*.yaml"],
    command: "node codegen/src/validate-spec.ts",
  },
  "logical-naming": {
    kind: "external",
    triggers: ["**/*.{ts,tsx,js,yaml,yml}"],
    command: "node scripts/lint/file-rules/logical-naming.js",
    acceptsFiles: true,
  },
  comments: {
    kind: "external",
    triggers: ["**/*.{ts,tsx,js,jsx,mjs,cjs,css,scss,yaml,yml,sh,md}"],
    command: "node scripts/lint/file-rules/comments.js",
    acceptsFiles: true,
  },
  // Project-specific checks — the typed registry shape.
  "no-as-unknown-cast": noAsUnknownCast,
  "no-document-typeof": noDocumentTypeof,
  "component-css": componentCss,
  "motion-scale": motionScale,
  "rhythm-tokens": rhythmTokens,
  "transitionable-property": transitionableProperty,
  "script-aggregators": scriptAggregators,
  "script-catalog": scriptCatalog,
  "script-entry-point": scriptEntryPoint,
  "exports-resolve": exportsResolve,
  "doc-paths": docPaths,
  "contract-snapshots": contractSnapshots,
  dogfood: dogfood,
  "config-paths": configPaths,
  "label-sync": labelSync,
  "codegen-tests": codegenTests,
  "codegen-import-direction": codegenImportDirection,
  changeset: changeset,
};
