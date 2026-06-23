import type { AtomicSpec, Spec, SpecPart } from "../../schema.ts";
import type { Issue } from "../../semantic-checks.ts";

type CompositeSpec = Spec & { kind: "composite" };

function isAtomic(spec: Spec): spec is AtomicSpec {
  return spec.kind === "atomic";
}

function isComposite(spec: Spec): spec is CompositeSpec {
  return spec.kind === "composite";
}

function issue(spec: string, path: string, message: string): Issue {
  return { spec, path, message };
}

function visitPart(
  part: SpecPart,
  path: string,
  visit: (node: AtomicSpec | SpecPart, path: string) => void,
): void {
  visit(part, path);
  for (const [childName, child] of Object.entries(part.parts ?? {})) {
    visitPart(child, `${path}.parts.${childName}`, visit);
  }
}

function visitNodes(spec: Spec, visit: (node: AtomicSpec | SpecPart, path: string) => void): void {
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

/**
 * `elementByProp` resolves the rendered tag at runtime from a controlling
 * prop's value. Four rules keep the generator output sound:
 *
 * - Mutually exclusive with sibling `element` (the tag has one source).
 * - The named prop must exist on the same node.
 * - The named prop must be `type: 'string'` — boolean / number / responsive
 *   prop types are out of scope for the v1 surface.
 * - The named prop's `values:` must enumerate exactly the map's keys (any
 *   value the consumer can pass must hit the map; every map key must be a
 *   valid prop value).
 *
 * Walks atomic root + composite parts via `visitNodes`.
 */
export function checkElementByProp(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  visitNodes(spec, (node, path) => {
    const ebp = node.elementByProp;
    if (!ebp) return;
    const base = path === "" ? "elementByProp" : `${path}.elementByProp`;
    if (node.element) {
      issues.push(
        issue(
          spec.name,
          base,
          "`elementByProp` and `element` are mutually exclusive — the rendered tag has one source",
        ),
      );
    }
    const controllingProp = node.props?.[ebp.prop];
    if (!controllingProp) {
      issues.push(
        issue(spec.name, `${base}.prop`, `prop '${ebp.prop}' is not declared on this node`),
      );
      return;
    }
    if (controllingProp.type !== "string") {
      issues.push(
        issue(
          spec.name,
          `${base}.prop`,
          `prop '${ebp.prop}' must be \`type: 'string'\`; got '${controllingProp.type}'`,
        ),
      );
    }
    const mapKeys = Object.keys(ebp.map).sort();
    const values = (controllingProp.values ?? []).slice().sort();
    if (mapKeys.length === 0) {
      issues.push(issue(spec.name, `${base}.map`, "`map` must declare at least one entry"));
    }
    const missingFromMap = values.filter((v) => !Object.hasOwn(ebp.map, v));
    const missingFromValues = mapKeys.filter((k) => !values.includes(k));
    if (missingFromMap.length > 0) {
      issues.push(
        issue(
          spec.name,
          `${base}.map`,
          `prop value(s) [${missingFromMap.join(", ")}] are not in the map`,
        ),
      );
    }
    if (missingFromValues.length > 0) {
      issues.push(
        issue(
          spec.name,
          `${base}.map`,
          `map key(s) [${missingFromValues.join(", ")}] are not declared in \`${ebp.prop}.values\``,
        ),
      );
    }
  });
  return issues;
}
