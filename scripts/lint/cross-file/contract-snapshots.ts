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
import { REPO_ROOT } from "../helpers/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

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

function checkContractSnapshots(): ViolationDetail[] {
  const out: ViolationDetail[] = [];
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
    const snapshotRel = relative(REPO_ROOT, snapshotPath);
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
      const missing = extractFixtureIds(specSource);
      if (missing.length > 0) {
        out.push({
          file: snapshotRel,
          message: `missing snapshot file (fixture id(s): ${missing.map((i) => `\`${i}\``).join(", ")})`,
        });
      }
      continue;
    }
    const { missing, orphan } = diffContractSnapshot(specSource, snapshot);
    if (missing.length > 0) {
      out.push({
        file: snapshotRel,
        message: `missing section(s) for fixture id(s) ${missing.map((i) => `\`${i}\``).join(", ")}`,
      });
    }
    if (orphan.length > 0) {
      out.push({
        file: snapshotRel,
        message: `orphan section(s) (no matching fixture id) ${orphan.map((i) => `\`${i}\``).join(", ")}`,
      });
    }
  }
  return out;
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: ["tests/contract/**", "specs/**", "apps/harness/src/fixtures/**"],
  run: checkContractSnapshots,
  hint: "Run `pnpm test:e2e -u` to refresh the affected snapshot.",
};
