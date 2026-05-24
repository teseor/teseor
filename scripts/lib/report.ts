// Uniform success/violation output for every check.

export type Location = { file: string; line?: number };

export type Violation = Location & { message: string };

export type Report = {
  name: string;
  /** Success-line noun (e.g. `test files`). Omit when there's no count. */
  noun?: string;
  /** Success-line count. When omitted, prints `<name>: clean`. */
  inspected?: number;
  violations: readonly Violation[];
  hint?: string;
};

/** Print and return the exit code (0 clean, 1 violations). */
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
