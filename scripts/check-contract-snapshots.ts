#!/usr/bin/env node
// Asserts every fixture ID listed in `tests/contract/<name>.spec.ts` has a
// matching `<!-- <id> -->` section in `tests/contract/<name>.spec.ts-snapshots/<name>.html`.
// The Playwright contract suite (browsers, CI-only) compares per-fixture DOM
// against this snapshot; pre-push cannot run it without a browser install.
// This check covers the most common drift — adding a fixture without
// refreshing the snapshot — without needing a browser. Byte-level changes
// inside an existing fixture stay a CI-only catch.
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const CONTRACT_DIR = resolve(REPO_ROOT, "tests", "contract");

/** Returns the `fixtureIds:` array from a generated `<name>.spec.ts`. */
export function extractFixtureIds(specSource: string): string[] {
  const match = specSource.match(/fixtureIds:\s*\[([\s\S]*?)\]/);
  if (!match || match[1] === undefined) return [];
  const inner = match[1];
  return [...inner.matchAll(/"([^"]+)"/g)]
    .map((m) => m[1])
    .filter((id): id is string => typeof id === "string");
}

/** Returns the `<!-- <id> -->` section IDs declared in a snapshot file. */
export function extractSnapshotIds(snapshot: string): string[] {
  return [...snapshot.matchAll(/^<!--\s*(\S.*?)\s*-->$/gm)]
    .map((m) => m[1])
    .filter((id): id is string => typeof id === "string");
}

type Violation = { component: string; missing: string[]; orphan: string[] };

/** Diff between the spec's fixture IDs and the snapshot's section markers. */
export function diffContractSnapshot(
  specSource: string,
  snapshot: string,
): { missing: string[]; orphan: string[] } {
  const expected = new Set(extractFixtureIds(specSource));
  const present = new Set(extractSnapshotIds(snapshot));
  const missing = [...expected].filter((id) => !present.has(id));
  const orphan = [...present].filter((id) => !expected.has(id));
  return { missing, orphan };
}

function main(): void {
  const violations: Violation[] = [];
  // Sort so violation output is stable across filesystems / CI runners.
  const specs = readdirSync(CONTRACT_DIR)
    .filter((f) => f.endsWith(".spec.ts") && !f.startsWith("_"))
    .sort();
  for (const spec of specs) {
    const component = spec.replace(/\.spec\.ts$/, "");
    const specSource = readFileSync(resolve(CONTRACT_DIR, spec), "utf8");
    const snapshotPath = resolve(
      CONTRACT_DIR,
      `${component}.spec.ts-snapshots`,
      `${component}.html`,
    );
    let snapshot: string | null = null;
    try {
      snapshot = readFileSync(snapshotPath, "utf8");
    } catch (err) {
      // Only "snapshot file absent" is a recoverable drift signal; surface any
      // other IO error (permissions, etc.) with its original stack.
      if (!(err instanceof Error && "code" in err && err.code === "ENOENT")) {
        throw err;
      }
    }
    if (snapshot === null) {
      violations.push({
        component,
        missing: extractFixtureIds(specSource),
        orphan: [],
      });
      continue;
    }
    const { missing, orphan } = diffContractSnapshot(specSource, snapshot);
    if (missing.length > 0 || orphan.length > 0) {
      violations.push({ component, missing, orphan });
    }
  }

  if (violations.length > 0) {
    const lines: string[] = [];
    for (const v of violations) {
      const snapshotRel = relative(
        REPO_ROOT,
        resolve(CONTRACT_DIR, `${v.component}.spec.ts-snapshots`, `${v.component}.html`),
      );
      if (v.missing.length > 0) {
        lines.push(
          `  - ${snapshotRel}: missing section(s) for fixture id(s) ${v.missing.map((i) => `\`${i}\``).join(", ")}`,
        );
      }
      if (v.orphan.length > 0) {
        lines.push(
          `  - ${snapshotRel}: orphan section(s) (no matching fixture id) ${v.orphan.map((i) => `\`${i}\``).join(", ")}`,
        );
      }
    }
    process.stderr.write(
      `Contract snapshot drift — run \`pnpm test:e2e -u\` to refresh:\n${lines.join("\n")}\n`,
    );
    process.exit(1);
  }
  process.stdout.write(`check-contract-snapshots: ${specs.length} components in sync\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
