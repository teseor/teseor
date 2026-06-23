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

// ── Examples reference real variant / intent / size ─────────────────────────

export function checkExamplesReferences(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  if (!isAtomic(spec)) return issues;
  const examples = spec.examples ?? [];
  const variants = new Set(Object.keys(spec.variants ?? {}));
  const intents = new Set(Object.keys(spec.intents ?? {}));
  const sizes = new Set(Object.keys(spec.sizes ?? {}));
  for (const example of examples) {
    const props = example.props ?? {};
    const variant = props.variant;
    if (typeof variant === "string" && !variants.has(variant)) {
      issues.push(
        issue(
          spec.name,
          `examples.${example.id}.props.variant`,
          `'${variant}' is not a declared variant.${suggestionFragment(variant, [...variants])}`,
        ),
      );
    }
    const intent = props.intent;
    if (typeof intent === "string" && !intents.has(intent)) {
      issues.push(
        issue(
          spec.name,
          `examples.${example.id}.props.intent`,
          `'${intent}' is not a declared intent.${suggestionFragment(intent, [...intents])}`,
        ),
      );
    }
    const size = props.size;
    if (typeof size === "string" && !sizes.has(size)) {
      issues.push(
        issue(
          spec.name,
          `examples.${example.id}.props.size`,
          `'${size}' is not a declared size.${suggestionFragment(size, [...sizes])}`,
        ),
      );
    }
  }
  return issues;
}

// ── `guidance.variantChoice` keys === `spec.variants` exactly ───────────────

export function checkVariantChoiceKeys(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  if (!isAtomic(spec)) return issues;
  const variantChoice = spec.guidance?.variantChoice;
  if (!variantChoice) return issues;
  const variantKeys = new Set(Object.keys(spec.variants ?? {}));
  const guidanceKeys = new Set(Object.keys(variantChoice));
  for (const key of variantKeys) {
    if (!guidanceKeys.has(key)) {
      issues.push(
        issue(
          spec.name,
          `guidance.variantChoice`,
          `variant '${key}' has no entry under guidance.variantChoice`,
        ),
      );
    }
  }
  for (const key of guidanceKeys) {
    if (!variantKeys.has(key)) {
      issues.push(
        issue(spec.name, `guidance.variantChoice.${key}`, `'${key}' is not a declared variant`),
      );
    }
  }
  return issues;
}
