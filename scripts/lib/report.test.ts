import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type Report, reportResult } from "./report.ts";

let stdoutWrites: string[];
let stderrWrites: string[];

beforeEach(() => {
  stdoutWrites = [];
  stderrWrites = [];
  vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
    stdoutWrites.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk: string | Uint8Array) => {
    stderrWrites.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
    return true;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const baseReport: Report = {
  name: "check-something",
  noun: "files",
  inspected: 3,
  violations: [],
};

describe("reportResult", () => {
  it("returns 0 and prints the success line when there are no violations", () => {
    const code = reportResult(baseReport);
    expect(code).toBe(0);
    expect(stdoutWrites.join("")).toBe("check-something: 3 files clean\n");
    expect(stderrWrites).toEqual([]);
  });

  it("returns 1 and lists violations with file:line", () => {
    const code = reportResult({
      ...baseReport,
      violations: [
        { file: "a.ts", line: 12, message: "bad cast" },
        { file: "b.ts", line: 4, message: "stale gate" },
      ],
    });
    expect(code).toBe(1);
    const out = stderrWrites.join("");
    expect(out).toContain("check-something: 2 violation(s):");
    expect(out).toContain("  - a.ts:12  bad cast");
    expect(out).toContain("  - b.ts:4  stale gate");
  });

  it("omits the line number when undefined", () => {
    const code = reportResult({
      ...baseReport,
      violations: [{ file: "package.json", message: "missing barrel" }],
    });
    expect(code).toBe(1);
    expect(stderrWrites.join("")).toContain("  - package.json  missing barrel");
  });

  it("appends the optional hint after the violation list", () => {
    reportResult({
      ...baseReport,
      violations: [{ file: "a.ts", line: 1, message: "x" }],
      hint: "Fix by doing Y.",
    });
    expect(stderrWrites.join("")).toContain("Fix by doing Y.");
  });
});
