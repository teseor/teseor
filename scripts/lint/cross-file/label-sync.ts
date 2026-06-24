// Fails when .github/labeler.yml references a label that .github/labels.yml
// does not define. The two files drift independently; this is the gate.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "../helpers/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

function labelerReferences(): string[] {
  const raw = readFileSync(resolve(REPO_ROOT, ".github/labeler.yml"), "utf8");
  const names: string[] = [];
  for (const line of raw.split("\n")) {
    // Top-level keys are label names: no indentation, not a comment, ends with ":".
    if (/^[^\s#].*:$/.test(line)) {
      names.push(line.slice(0, -1));
    }
  }
  return names;
}

function definedLabels(): Set<string> {
  const raw = readFileSync(resolve(REPO_ROOT, ".github/labels.yml"), "utf8");
  const names = new Set<string>();
  for (const line of raw.split("\n")) {
    if (line.startsWith("- name:")) {
      names.add(line.slice("- name:".length).trim());
    }
  }
  return names;
}

function checkLabelSync(): ViolationDetail[] {
  const refs = labelerReferences();
  const defined = definedLabels();
  return refs
    .filter((name) => !defined.has(name))
    .map((name) => ({
      file: ".github/labeler.yml",
      message: `references undefined label \`${name}\``,
    }));
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: [".github/labeler.yml", ".github/labels.yml", "specs/**"],
  run: checkLabelSync,
  hint:
    "Add the missing label(s) to `.github/labels.yml`.\n" +
    "Component-scoped entries regenerate via `scripts/maintenance/sync-labels.ts --mode=generate`.",
};
