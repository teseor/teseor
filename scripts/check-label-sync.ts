#!/usr/bin/env node
// Fails when .github/labeler.yml references a label that .github/labels.yml
// does not define. The two files drift independently; this is the gate.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const labelerPath = resolve(repoRoot, ".github/labeler.yml");
const labelsPath = resolve(repoRoot, ".github/labels.yml");

function labelerReferences(): string[] {
  const raw = readFileSync(labelerPath, "utf8");
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
  const raw = readFileSync(labelsPath, "utf8");
  const names = new Set<string>();
  for (const line of raw.split("\n")) {
    if (line.startsWith("- name:")) {
      names.add(line.slice("- name:".length).trim());
    }
  }
  return names;
}

const references = labelerReferences();
const defined = definedLabels();
const missing = references.filter((name) => !defined.has(name));

if (missing.length > 0) {
  console.error(
    `.github/labeler.yml references label(s) with no definition in .github/labels.yml:\n${missing
      .map((name) => `  - ${name}`)
      .join(
        "\n",
      )}\nAdd them to .github/labels.yml (component:* entries regenerate via sync-labels.ts).`,
  );
  process.exit(1);
}

console.log(`check-label-sync: ${references.length} labeler references all defined in labels.yml`);
