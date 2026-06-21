import { mkdtempSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAckFresh, parseAckStamp } from "./claude-codegen-audit-guard.js";

function makeAck(content: string): string {
  const dir = mkdtempSync(resolve(tmpdir(), "ack-guard-"));
  const path = resolve(dir, "ack");
  writeFileSync(path, content);
  // Pin mtime far in the past to prove the content stamp — not mtime — drives
  // the freshness decision (the reason this hook had to change).
  utimesSync(path, 1000, 1000);
  return path;
}

describe("parseAckStamp", () => {
  it("parses ISO 8601 strings", () => {
    expect(parseAckStamp("2026-06-21T12:00:00Z")).toBe(Date.parse("2026-06-21T12:00:00Z"));
  });

  it("treats a 10-digit integer as Unix seconds", () => {
    expect(parseAckStamp("1782000000")).toBe(1782000000 * 1000);
  });

  it("treats a 13-digit integer as Unix milliseconds", () => {
    expect(parseAckStamp("1782000000000")).toBe(1782000000000);
  });

  it("trims surrounding whitespace", () => {
    expect(parseAckStamp("  2026-06-21T12:00:00Z\t")).toBe(Date.parse("2026-06-21T12:00:00Z"));
  });

  it("returns NaN for an empty line", () => {
    expect(Number.isNaN(parseAckStamp(""))).toBe(true);
    expect(Number.isNaN(parseAckStamp("   "))).toBe(true);
  });

  it("returns NaN for unparseable input", () => {
    expect(Number.isNaN(parseAckStamp("not-a-date"))).toBe(true);
  });
});

describe("isAckFresh", () => {
  const commitMs = Date.parse("2026-06-21T12:00:00Z");

  it("returns true when the ack timestamp is newer than the commit", () => {
    const ack = makeAck("2026-06-21T13:00:00Z\n");
    expect(isAckFresh(ack, commitMs)).toBe(true);
  });

  it("returns true when the ack timestamp matches the commit (>= boundary)", () => {
    const ack = makeAck("2026-06-21T12:00:00Z\n");
    expect(isAckFresh(ack, commitMs)).toBe(true);
  });

  it("returns false when the ack timestamp is older than the commit", () => {
    const ack = makeAck("2026-06-21T11:00:00Z\n");
    expect(isAckFresh(ack, commitMs)).toBe(false);
  });

  it("ignores mtime entirely — content-stamp drives the decision", () => {
    // mtime is pinned to 1970 (utimesSync above); the ack must still pass
    // because its first line is in the future. This is the regression guard
    // for issue #861 — under Claude Code's sandbox, mtime stays pinned even
    // after a rewrite, so a stale mtime can no longer reject a fresh ack.
    const ack = makeAck("2026-06-21T13:00:00Z\n");
    expect(isAckFresh(ack, commitMs)).toBe(true);
  });

  it("accepts Unix seconds on the first line", () => {
    const ack = makeAck(`${Math.floor(commitMs / 1000) + 60}\n`);
    expect(isAckFresh(ack, commitMs)).toBe(true);
  });

  it("returns false when the ack file is missing", () => {
    expect(isAckFresh(resolve(tmpdir(), "does-not-exist-xyz"), commitMs)).toBe(false);
  });

  it("returns false when the first line is unparseable", () => {
    const ack = makeAck("nope\n2026-06-21T13:00:00Z\n");
    expect(isAckFresh(ack, commitMs)).toBe(false);
  });

  it("only reads the first line", () => {
    // First line valid but older than the commit; a fresher second line must
    // NOT rescue the ack — the format is strictly first-line.
    const ack = makeAck("2026-06-21T11:00:00Z\n2026-06-21T13:00:00Z\n");
    expect(isAckFresh(ack, commitMs)).toBe(false);
  });
});
