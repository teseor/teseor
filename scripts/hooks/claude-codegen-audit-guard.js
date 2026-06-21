#!/usr/bin/env node
// Claude Code PreToolUse guard fired before `git push`.
// Requires the most recent commit subject to include `audit: codegen-surface`,
// or `.claude/codegen-audit-ack` to contain a timestamp (ISO 8601 or Unix
// seconds / milliseconds) on its first line newer than the most recent commit.
// Content-stamp (not mtime) because Claude Code's sandboxed Bash does not bump
// mtime on `touch` / `rm + echo >`. Four-category audit reference lives in the
// project memory `project_codegen_surface_audit`.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CODEGEN_PATTERNS = [
  /^scripts\/codegen\/src\/generators\//,
  /^scripts\/codegen\/src\/schema\.ts$/,
  /^scripts\/codegen\/src\/lib\/flatten\.ts$/,
];

const AUDIT_TOKEN = "audit: codegen-surface";
const ACK_FILE = ".claude/codegen-audit-ack";

const MEMORY_POINTER = "memory: project_codegen_surface_audit (~/.claude/projects/.../memory/)";

function readStdinSync() {
  try {
    // Claude Code passes the tool call payload as JSON on stdin (fd 0).
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function parsePayload(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getCommand(payload) {
  return payload?.tool_input?.command ?? "";
}

// Git global flags whose value is a separate token (`git --work-tree /x push`).
// Bundled form (`--work-tree=/x`) is handled by the `=` branch below regardless.
// Anything not listed here is treated as value-less so `git --no-pager push`,
// `git --bare push`, `git -p push` etc. parse correctly.
const GIT_LONG_FLAGS_TAKING_VALUE = new Set([
  "--exec-path",
  "--git-dir",
  "--work-tree",
  "--namespace",
  "--super-prefix",
  "--config-env",
  "--list-cmds",
]);

function isGitPush(command) {
  // Tokenize per shell segment and look for `git ... push` where `push` is the
  // first non-flag token after `git`. Handles bundled (`--git-dir=/x`) and
  // separated (`-c name=value`, `--work-tree /x`) value-taking flags.
  const segments = command.split(/;|&&|\|\|/);
  for (const seg of segments) {
    const tokens = seg.trim().split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] !== "git") continue;
      let j = i + 1;
      while (j < tokens.length) {
        const t = tokens[j];
        if (!t.startsWith("-")) break;
        if (t.includes("=")) {
          j += 1;
          continue;
        }
        if (t === "-C" || t === "-c") {
          j += 2;
          continue;
        }
        if (GIT_LONG_FLAGS_TAKING_VALUE.has(t)) {
          j += 2;
          continue;
        }
        j += 1;
      }
      if (tokens[j] === "push") return true;
    }
  }
  return false;
}

function gitOut(args) {
  // execFileSync avoids any shell interpretation of args (ref names, paths).
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function getPushRangeFiles() {
  // Compare HEAD against the upstream tracking branch; fall back to
  // `origin/main` (the project's main branch per CLAUDE.md).
  let base = "";
  try {
    base = gitOut(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
  } catch {
    base = "origin/main";
  }
  let files = "";
  try {
    files = gitOut(["diff", "--name-only", `${base}...HEAD`]);
  } catch {
    // No upstream / unreachable base — fall back to last-commit files so we
    // still trip on a fresh branch.
    try {
      files = gitOut(["diff", "--name-only", "HEAD~1...HEAD"]);
    } catch {
      // Single-commit branch (no HEAD~1) — list files in the tip commit.
      files = gitOut(["show", "--name-only", "--pretty=", "HEAD"]);
    }
  }
  return files ? files.split("\n").filter(Boolean) : [];
}

function touchesCodegen(files) {
  return files.some((f) => CODEGEN_PATTERNS.some((re) => re.test(f)));
}

function lastCommitSubject() {
  return gitOut(["log", "-1", "--pretty=%s"]);
}

function lastCommitTimestamp() {
  return Number(gitOut(["log", "-1", "--pretty=%ct"])) * 1000;
}

export function parseAckStamp(firstLine) {
  const line = firstLine.trim();
  if (!line) return Number.NaN;
  // Integer-only token: treat as Unix seconds (10 digits) or milliseconds (13+).
  if (/^\d+$/.test(line)) {
    const n = Number(line);
    return line.length <= 10 ? n * 1000 : n;
  }
  // Otherwise fall back to ISO 8601 / any Date-parseable string.
  return Date.parse(line);
}

export function isAckFresh(ackPath, commitTimestampMs) {
  if (!existsSync(ackPath)) return false;
  try {
    const firstLine = readFileSync(ackPath, "utf8").split("\n")[0];
    const stamp = parseAckStamp(firstLine);
    if (!Number.isFinite(stamp)) return false;
    // `>=` so coarse-resolution timestamps don't reject an ack written in the
    // same second as the commit.
    return stamp >= commitTimestampMs;
  } catch {
    return false;
  }
}

function ackFileFresh(repoRoot) {
  return isAckFresh(resolve(repoRoot, ACK_FILE), lastCommitTimestamp());
}

function denyMessage() {
  return [
    "",
    "Codegen-surface audit acknowledgement required.",
    "",
    "The push range touches codegen surface (generators / schema / flatten).",
    "Run the four-category audit before pushing:",
    "",
    "  1. Schema-accepts / generator-drops gap",
    "  2. Raw spec strings used as JS identifiers",
    "  3. Inherited type / template collisions",
    "  4. Documentation symmetry (RFC / JSDoc / docs / runtime)",
    "",
    `Reference: ${MEMORY_POINTER}`,
    "",
    "Acknowledge by either:",
    `  - including \`${AUDIT_TOKEN}\` in the most recent commit subject, or`,
    `  - writing a current timestamp into \`${ACK_FILE}\` as the first line:`,
    '      node -e \'require("node:fs").writeFileSync(".claude/codegen-audit-ack", new Date().toISOString() + "\\n")\'',
    "    (ISO 8601, or Unix seconds / milliseconds — must be >= last commit time)",
    "",
  ].join("\n");
}

function emitDecision(decision, reason) {
  // Claude Code reads a JSON object on stdout to decide allow / block.
  process.stdout.write(
    `${JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    })}\n`,
  );
}

function main() {
  const payload = parsePayload(readStdinSync());
  const command = getCommand(payload);

  if (!command || !isGitPush(command)) {
    // Not a git push — allow silently. (Claude Code treats no output as allow.)
    return;
  }

  let repoRoot = "";
  try {
    repoRoot = gitOut(["rev-parse", "--show-toplevel"]);
  } catch {
    // Not inside a git repo — nothing to guard.
    return;
  }

  process.chdir(repoRoot);

  const files = getPushRangeFiles();
  if (!touchesCodegen(files)) return;

  const subject = lastCommitSubject();
  if (subject.includes(AUDIT_TOKEN)) return;

  if (ackFileFresh(repoRoot)) return;

  const reason = denyMessage();
  emitDecision("deny", reason);
  process.stderr.write(`${reason}\n`);
  process.exit(2);
}

// Run only when invoked as a script, not when imported by tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
