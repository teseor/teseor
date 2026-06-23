import type { Spec } from "../../schema.ts";
import type { Issue } from "../../semantic-checks.ts";

type AtomicSpec = Spec & { kind: "atomic" };

function isAtomic(spec: Spec): spec is AtomicSpec {
  return spec.kind === "atomic";
}

function issue(spec: string, path: string, message: string): Issue {
  return { spec, path, message };
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const del = (prev[j] ?? 0) + 1;
      const ins = (curr[j - 1] ?? 0) + 1;
      const sub = (prev[j - 1] ?? 0) + cost;
      curr[j] = Math.min(del, ins, sub);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j] ?? 0;
  }
  return prev[b.length] ?? 0;
}

function suggest(
  candidate: string,
  options: readonly string[],
  maxDistance = 3,
): string | undefined {
  let best: { name: string; distance: number } | undefined;
  for (const option of options) {
    const distance = levenshtein(candidate.toLowerCase(), option.toLowerCase());
    if (distance > maxDistance) continue;
    if (best === undefined || distance < best.distance) best = { name: option, distance };
  }
  return best?.name;
}

function suggestionFragment(name: string, options: readonly string[]): string {
  const hint = suggest(name, options);
  return hint ? ` Did you mean '${hint}'?` : "";
}

function collectDimensionValues(spec: AtomicSpec, dim: string): string[] {
  switch (dim) {
    case "variant":
      return Object.keys(spec.variants ?? {});
    case "intent":
      return Object.keys(spec.intents ?? {});
    case "size":
      return Object.keys(spec.sizes ?? {});
    case "visualStates":
      return Object.keys(spec.visualStates ?? {});
    default: {
      const propDef = spec.props?.[dim];
      if (propDef?.values) return propDef.values;
      return [];
    }
  }
}

export function checkCoverageShape(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  if (!isAtomic(spec)) return issues;
  const coverage = spec.coverage;
  if (!coverage) return issues;
  for (const [dimName, declaration] of Object.entries(coverage)) {
    const declared = collectDimensionValues(spec, dimName);
    if (declared.length === 0) {
      issues.push(
        issue(
          spec.name,
          `coverage.${dimName}`,
          `dimension '${dimName}' is not declared on the spec (no variants/intents/sizes/states/props entry)`,
        ),
      );
      continue;
    }
    if (Array.isArray(declaration)) {
      for (const value of declaration) {
        if (!declared.includes(value)) {
          issues.push(
            issue(
              spec.name,
              `coverage.${dimName}`,
              `'${value}' is not a declared value of '${dimName}'.${suggestionFragment(value, declared)}`,
            ),
          );
        }
      }
    }
  }
  return issues;
}
