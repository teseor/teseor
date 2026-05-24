#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const PACKAGES_DIR = join(ROOT, "packages");

const SCANNED_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".css"]);

const DEV_PATTERNS = [
  { label: "__DEV__", re: /\b__DEV__\b/ },
  { label: "console.warn", re: /\bconsole\.warn\s*\(/ },
  { label: "console.error", re: /\bconsole\.error\s*\(/ },
  { label: "console.debug", re: /\bconsole\.debug\s*\(/ },
  { label: "console.info", re: /\bconsole\.info\s*\(/ },
  { label: "console.trace", re: /\bconsole\.trace\s*\(/ },
];

function walk(dir) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      out = out.concat(walk(path));
    } else if (entry.isFile() && SCANNED_EXTENSIONS.has(extname(entry.name))) {
      out.push(path);
    }
  }
  return out;
}

function findDistDirs() {
  let pkgs;
  try {
    pkgs = readdirSync(PACKAGES_DIR, { withFileTypes: true });
  } catch {
    return [];
  }
  const dists = [];
  for (const pkg of pkgs) {
    if (!pkg.isDirectory()) continue;
    const dist = join(PACKAGES_DIR, pkg.name, "dist");
    try {
      if (statSync(dist).isDirectory()) dists.push(dist);
    } catch {
      // package has no dist yet — fine
    }
  }
  return dists;
}

function scanFile(path) {
  const content = readFileSync(path, "utf8");
  const violations = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    for (const { label, re } of DEV_PATTERNS) {
      const match = line.match(re);
      if (match) {
        violations.push({
          path,
          line: i + 1,
          column: (match.index ?? 0) + 1,
          label,
          text: line.trim().slice(0, 120),
        });
      }
    }
  }
  return violations;
}

function main() {
  const distDirs = findDistDirs();
  if (distDirs.length === 0) {
    process.stdout.write("verify-no-dev-leak: no packages/*/dist directories found; skipping.\n");
    process.exit(0);
  }

  let total = 0;
  for (const dist of distDirs) {
    for (const file of walk(dist)) {
      for (const v of scanFile(file)) {
        const rel = relative(ROOT, v.path);
        process.stdout.write(`${rel}:${v.line}:${v.column}: [${v.label}] ${v.text}\n`);
        total += 1;
      }
    }
  }

  if (total > 0) {
    process.stdout.write(
      `\n${total} dev-only marker${total === 1 ? "" : "s"} found in production bundles.\n`,
    );
    process.stdout.write(
      "Dev-only branches must be guarded by __DEV__ (or equivalent) so the bundler tree-shakes them.\n",
    );
    process.exit(1);
  }

  process.stdout.write(
    `verify-no-dev-leak: scanned ${distDirs.length} dist director${distDirs.length === 1 ? "y" : "ies"}, no dev leaks.\n`,
  );
  process.exit(0);
}

main();
