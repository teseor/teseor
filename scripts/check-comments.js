#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { extname, relative } from "node:path";

const PATTERNS = [
  {
    label: "phase marker",
    re: /\bv\d+\.\d+\b/i,
    hint: "Roadmap phase reference rots; describe what the file IS, not when it ships.",
  },
  {
    label: "decision id",
    re: /\([MG]\d+\)/,
    hint: "Decision IDs live in handover/session notes, not in committed artifacts.",
  },
  {
    label: "TODO/FIXME",
    re: /\b(TODO|FIXME)\b/,
    hint: "Use `/issue-this <description>` to file an issue instead of an inline TODO.",
  },
  {
    label: "doc-path pointer",
    re: /\bdocs\/[a-z]/i,
    hint: "Paths to docs/ rot during refactors; describe the file directly.",
  },
  {
    label: "ADR reference",
    re: /\bADR-\d+/,
    hint: "ADR numbers re-number during merges; describe the constraint inline.",
  },
  {
    label: "audit code",
    re: /\baudit [A-Z]\d+\b/,
    hint: "Audit codes only resolve with the handover open; strip from artifacts.",
  },
];

const EXEMPT_PATH_RES = [
  /^docs\//,
  /^\.claude\//,
  /^\.local\//,
  /^scripts\/check-comments\.js$/,
  /^CLAUDE\.md$/,
  /^README\.md$/i,
  /^CONTRIBUTING\.md$/i,
  /^CODE_OF_CONDUCT\.md$/i,
  /^CHANGELOG\.md$/i,
  /(^|\/)\.changeset\//,
];

const SCANNABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
  ".yaml",
  ".yml",
  ".sh",
  ".md",
]);

function isExempt(path) {
  for (const re of EXEMPT_PATH_RES) if (re.test(path)) return true;
  return false;
}

function isScannable(path) {
  const ext = extname(path).toLowerCase();
  return SCANNABLE_EXTENSIONS.has(ext);
}

function commentRangesForLine(line, ext) {
  const ranges = [];
  if (ext === ".yaml" || ext === ".yml" || ext === ".sh") {
    const hashIdx = line.indexOf("#");
    if (hashIdx !== -1) ranges.push([hashIdx, line.length]);
  } else if (
    ext === ".js" ||
    ext === ".ts" ||
    ext === ".tsx" ||
    ext === ".jsx" ||
    ext === ".mjs" ||
    ext === ".cjs"
  ) {
    const lineComment = line.indexOf("//");
    if (lineComment !== -1) ranges.push([lineComment, line.length]);
    const blockOpen = line.indexOf("/*");
    if (blockOpen !== -1) {
      const blockClose = line.indexOf("*/", blockOpen + 2);
      ranges.push([blockOpen, blockClose === -1 ? line.length : blockClose + 2]);
    }
    if (line.trimStart().startsWith("*") && !line.includes("//")) {
      ranges.push([0, line.length]);
    }
  } else if (ext === ".css" || ext === ".scss") {
    const blockOpen = line.indexOf("/*");
    if (blockOpen !== -1) {
      const blockClose = line.indexOf("*/", blockOpen + 2);
      ranges.push([blockOpen, blockClose === -1 ? line.length : blockClose + 2]);
    }
  } else if (ext === ".md") {
    return [[0, line.length]];
  }
  return ranges;
}

function scanFile(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return [];
  }
  const ext = extname(path).toLowerCase();
  const violations = [];
  const lines = raw.split(/\r?\n/);
  let inBlockComment = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    let ranges = commentRangesForLine(line, ext);
    if (inBlockComment) {
      ranges = [[0, line.length], ...ranges];
      if (line.includes("*/")) inBlockComment = false;
    } else if (
      (line.includes("/*") && !line.includes("*/")) ||
      (line.includes("/*") && line.indexOf("/*") > line.lastIndexOf("*/"))
    ) {
      inBlockComment = true;
    }
    if (ranges.length === 0) continue;
    for (const [start, end] of ranges) {
      const snippet = line.slice(start, end);
      for (const { label, re, hint } of PATTERNS) {
        const match = snippet.match(re);
        if (match) {
          violations.push({
            path,
            line: i + 1,
            column: start + (match.index ?? 0) + 1,
            label,
            hint,
            text: line.trim(),
          });
        }
      }
    }
  }
  return violations;
}

function collectArgs() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("--staged")) {
    const out = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], {
      encoding: "utf8",
    });
    return out.split("\n").filter(Boolean);
  }
  if (argv.includes("--working")) {
    const out = execFileSync("git", ["ls-files", "--modified", "--others", "--exclude-standard"], {
      encoding: "utf8",
    });
    return out.split("\n").filter(Boolean);
  }
  if (argv.includes("--all")) {
    const out = execFileSync("git", ["ls-files"], { encoding: "utf8" });
    return out.split("\n").filter(Boolean);
  }
  return argv.filter((arg) => !arg.startsWith("--"));
}

function main() {
  const files = collectArgs()
    .filter((p) => !isExempt(p))
    .filter((p) => isScannable(p))
    .filter((p) => {
      try {
        return statSync(p).isFile();
      } catch {
        return false;
      }
    });

  let total = 0;
  for (const file of files) {
    const violations = scanFile(file);
    for (const v of violations) {
      const rel = relative(process.cwd(), v.path);
      process.stdout.write(`${rel}:${v.line}:${v.column}: [${v.label}] ${v.hint}\n  ${v.text}\n`);
      total += 1;
    }
  }
  if (total > 0) {
    process.stdout.write(
      `\n${total} no-plan-marker violation${total === 1 ? "" : "s"}. Strip phase markers, decision IDs, doc pointers, and TODOs before committing.\n`,
    );
    process.exit(1);
  }
  process.exit(0);
}

main();
