import type { AtomicSpec, CompositeSpec, Spec, SpecPart } from "../schema.ts";

export type { AtomicSpec, CompositeSpec };

export type Issue = {
  spec: string;
  path: string;
  message: string;
};

export function issue(spec: string, path: string, message: string): Issue {
  return { spec, path, message };
}

export function levenshtein(a: string, b: string): number {
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

export function suggest(
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

export function suggestionFragment(name: string, options: readonly string[]): string {
  const hint = suggest(name, options);
  return hint ? ` Did you mean '${hint}'?` : "";
}

export function isAtomic(spec: Spec): spec is AtomicSpec {
  return spec.kind === "atomic";
}

export function isComposite(spec: Spec): spec is CompositeSpec {
  return spec.kind === "composite";
}

export function visitPart(
  part: SpecPart,
  path: string,
  visit: (node: AtomicSpec | SpecPart, path: string) => void,
): void {
  visit(part, path);
  for (const [childName, child] of Object.entries(part.parts ?? {})) {
    visitPart(child, `${path}.parts.${childName}`, visit);
  }
}

export function visitNodes(
  spec: Spec,
  visit: (node: AtomicSpec | SpecPart, path: string) => void,
): void {
  if (isAtomic(spec)) {
    visit(spec, "");
    return;
  }
  if (isComposite(spec)) {
    for (const [partName, part] of Object.entries(spec.parts)) {
      visitPart(part, `parts.${partName}`, visit);
    }
  }
}

export function visitCompositeParts(
  parts: Record<string, SpecPart>,
  fn: (part: SpecPart) => void,
): void {
  for (const part of Object.values(parts)) {
    fn(part);
    if (part.parts) visitCompositeParts(part.parts, fn);
  }
}

export function visitAllNodes(spec: Spec, fn: (part: AtomicSpec | SpecPart) => void): void {
  if (isAtomic(spec)) {
    fn(spec);
    return;
  }
  if (isComposite(spec)) {
    visitCompositeParts(spec.parts, fn);
  }
}

export function collectDimensionValues(spec: AtomicSpec, dim: string): string[] {
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
