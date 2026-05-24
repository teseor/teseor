// One consistent error/success format across every check script. The
// shape used to vary — some used `console.error`, some `process.stderr`,
// some printed counts differently — which made the lefthook summary
// harder to scan when multiple checks ran in parallel.

export type Location = { file: string; line?: number };

export type Violation = Location & { message: string };

export type Report = {
  /** Short script name printed as the line prefix (e.g. `check-component-css`). */
  name: string;
  /** Human-readable count noun in the success line (e.g. `components`, `test files`).
   *  Omit when there's no meaningful per-item count (workspace invariants). */
  noun?: string;
  /** Number of items inspected for the success line ("N noun(s) clean").
   *  When omitted, the success line is "<name>: clean". */
  inspected?: number;
  /** Violations to report; empty array means clean. */
  violations: readonly Violation[];
  /** Optional multi-line hint appended after the violation list. */
  hint?: string;
};

/** Print the result and return the process exit code (0 clean, 1 violations).
 *  Callers should `process.exit(reportResult(...))`. */
export function reportResult({ name, noun, inspected, violations, hint }: Report): number {
  if (violations.length === 0) {
    if (inspected !== undefined && noun !== undefined) {
      process.stdout.write(`${name}: ${inspected} ${noun} clean\n`);
    } else {
      process.stdout.write(`${name}: clean\n`);
    }
    return 0;
  }
  const lines = violations.map((v) => {
    const where = v.line === undefined ? v.file : `${v.file}:${v.line}`;
    return `  - ${where}  ${v.message}`;
  });
  const hintBlock = hint ? `\n\n${hint}\n` : "\n";
  process.stderr.write(
    `${name}: ${violations.length} violation(s):\n${lines.join("\n")}${hintBlock}`,
  );
  return 1;
}
