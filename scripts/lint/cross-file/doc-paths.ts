#!/usr/bin/env node
// Resolves every backtick-wrapped path-shaped reference in the docs and fails
// on a miss. The docs cross-reference each other through prose backticks
// (`rules/motion.md`, `codegen/`), not Markdown links, so a renamed
// file leaves dangling text that markdown-link checkers do not see.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { REPO_ROOT } from "../helpers/paths.ts";
import type { ViolationDetail, WorkspaceCheck } from "../registry.ts";

const DOCS_DIR = resolve(REPO_ROOT, "docs");
const ALLOWLIST_FILE = resolve(REPO_ROOT, "scripts/lint/cross-file/.doc-path-allowlist.txt");

// Repo top-level directories — a backtick span starting with one of these is
// considered path-shaped even if it has no file extension.
const TOP_LEVEL = [
  ".changeset",
  ".claude",
  ".github",
  "apps",
  "docs",
  "packages",
  "scripts",
  "specs",
  "tests",
  "themes",
];

// Extensions that mark a backtick span as path-shaped even without a known
// top-level prefix (allows `architecture/themes.md` referenced from inside
// docs/, resolved relative to docs/).
const KNOWN_EXTENSIONS = new Set([
  ".md",
  ".mdx",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".yaml",
  ".yml",
  ".css",
  ".scss",
  ".html",
  ".sh",
  ".astro",
  ".vue",
  ".svelte",
  ".snap",
]);

function listMarkdownFiles(): string[] {
  const out: string[] = [];
  walk(DOCS_DIR, out);
  for (const name of readdirSync(REPO_ROOT)) {
    if (name.endsWith(".md")) out.push(resolve(REPO_ROOT, name));
  }
  return out;
}

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = resolve(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, out);
    } else if (name.endsWith(".md") || name.endsWith(".mdx")) {
      out.push(full);
    }
  }
}

/** Strip triple-backtick fenced blocks. Inline backticks inside fenced code
 * are out of scope; the rule targets prose references. */
function stripFences(source: string): string {
  return source.replace(/```[\s\S]*?```/g, (block) => block.replace(/[^\n]/g, " "));
}

/** Strip a trailing line-number / anchor from a path candidate. */
function stripSuffix(path: string): string {
  return path
    .replace(/#L\d+(?:-L?\d+)?$/, "") // GitHub line-range anchor
    .replace(/#[A-Za-z0-9_-]+$/, "") // Markdown / docs anchor
    .replace(/:\d+(?::\d+)?$/, ""); // file:line[:col]
}

function lastSegmentExtension(path: string): string {
  const lastSlash = path.lastIndexOf("/");
  const tail = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
  const dot = tail.lastIndexOf(".");
  return dot >= 0 ? tail.slice(dot) : "";
}

function isPathShaped(candidate: string): boolean {
  // Skip URLs.
  if (/^[a-z]+:\/\//i.test(candidate)) return false;
  if (/^mailto:/i.test(candidate)) return false;
  // Skip npm package specifiers (`@scope/pkg`, `pkg/subpath`).
  if (candidate.startsWith("@")) return false;
  // Skip URL routes / absolute paths — backticks around `/react/` or
  // `/migrations/v<from>-to-<to>` describe app routes, not repo files.
  if (candidate.startsWith("/")) return false;
  // Skip placeholders / globs / patterns that aren't a literal path.
  if (/[<>{}*]/.test(candidate)) return false;
  if (/\s/.test(candidate)) return false;
  // Skip flags.
  if (candidate.startsWith("--")) return false;

  if (TOP_LEVEL.some((d) => candidate === d || candidate.startsWith(`${d}/`))) return true;
  if (candidate.endsWith("/") && candidate.includes("/")) return true;
  if (KNOWN_EXTENSIONS.has(lastSegmentExtension(candidate)) && candidate.includes("/")) return true;
  return false;
}

/** Allowlist of forward-reference path prefixes — paths the docs name but
 * the tree doesn't carry yet (build artifacts, future packages, future
 * components). One prefix per line in `.doc-path-allowlist.txt`. */
export function loadAllowlist(): string[] {
  try {
    return readFileSync(ALLOWLIST_FILE, "utf8")
      .split("\n")
      .map((l) => l.replace(/#.*$/, "").trim())
      .filter((l) => l.length > 0);
  } catch {
    return [];
  }
}

function isAllowlisted(candidate: string, allowlist: readonly string[]): boolean {
  return allowlist.some((prefix) => candidate.startsWith(prefix));
}

/** Resolve a path candidate against the repo, the doc's parent directory, and
 * `docs/`. Returns the first existing target, or undefined. */
function resolveCandidate(candidate: string, fromFile: string): string | undefined {
  const tries = [
    resolve(REPO_ROOT, candidate),
    resolve(dirname(fromFile), candidate),
    resolve(DOCS_DIR, candidate),
  ];
  for (const path of tries) {
    try {
      statSync(path);
      return path;
    } catch {
      // not found at this location — try the next
    }
  }
  return undefined;
}

export function findDanglingPaths(
  source: string,
  filePath: string,
  allowlist: readonly string[] = [],
): { reference: string; line: number }[] {
  const cleaned = stripFences(source);
  const lines = cleaned.split("\n");
  const out: { reference: string; line: number }[] = [];
  const backtickSpan = /`([^`\n]+)`/g;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    for (const match of line.matchAll(backtickSpan)) {
      const raw = match[1];
      if (raw === undefined) continue;
      if (!isPathShaped(raw)) continue;
      const stripped = stripSuffix(raw);
      if (isAllowlisted(stripped, allowlist)) continue;
      if (!resolveCandidate(stripped, filePath)) {
        out.push({ reference: raw, line: i + 1 });
      }
    }
  }
  return out;
}

function checkDocPaths(): ViolationDetail[] {
  const files = listMarkdownFiles();
  const allowlist = loadAllowlist();
  const out: ViolationDetail[] = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const { reference, line } of findDanglingPaths(source, file, allowlist)) {
      out.push({
        file: relative(REPO_ROOT, file),
        line,
        message: `\`${reference}\` does not resolve`,
      });
    }
  }
  return out;
}

export const rule: WorkspaceCheck = {
  kind: "workspace",
  triggers: ["**/*.md", "**/*.mdx"],
  run: checkDocPaths,
  hint: "Backtick-wrapped path-shaped references must resolve. Add a prefix to the allowlist for forward-references.",
};
