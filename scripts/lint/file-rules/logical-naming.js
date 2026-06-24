#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { argv, cwd, exit } from "node:process";

const SPEC_KEY_RE = /^\s+([a-z][A-Za-z0-9]*?(Left|Right|Top|Bottom)):/;
const DATA_POSITION_RE = /data-position\s*=\s*"(left|right|top|bottom)"/;

const DEFAULT_SCAN_DIRS = ["specs", "codegen/src"];
const SCAN_EXTS = [".yaml", ".yml", ".ts", ".tsx", ".js"];

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, out);
    } else if (SCAN_EXTS.some((ext) => name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

const cliArgs = argv.slice(2);
let files;
if (cliArgs.length > 0) {
  files = cliArgs;
} else {
  files = [];
  for (const dir of DEFAULT_SCAN_DIRS) {
    walk(join(cwd(), dir), files);
  }
}

const failures = [];

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined) continue;
    if (file.endsWith(".yaml") || file.endsWith(".yml")) {
      // _vocabulary.yaml carries canonical browser-API names (KeyboardEvent.key
      // arrow keys) — they're hardware, not styling direction, so the
      // physical-vs-logical guidance doesn't apply.
      if (file.endsWith("_vocabulary.yaml")) continue;
      const match = line.match(SPEC_KEY_RE);
      if (match) {
        failures.push(
          `${file}:${i + 1}  prop key "${match[1]}" uses physical naming — rename to *Start/*End (or *BlockStart/*BlockEnd for vertical)`,
        );
      }
    }
    if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js")) {
      const match = line.match(DATA_POSITION_RE);
      if (match) {
        failures.push(
          `${file}:${i + 1}  data-position="${match[1]}" uses physical naming — use "start"/"end" instead`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  process.stderr.write("Logical-naming check failed:\n");
  for (const failure of failures) {
    process.stderr.write(`  ${failure}\n`);
  }
  process.stderr.write(
    "\nUse inline-start/inline-end (or block-start/block-end for vertical) instead of left/right/top/bottom. RTL-safe by construction.\n",
  );
  exit(1);
}
exit(0);
