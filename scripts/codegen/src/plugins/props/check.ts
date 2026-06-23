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
 * Every non-slot prop must declare `responsive:` explicitly (`true` or
 * `false`). Omission silently defaults to non-responsive — making the
 * decision invisible in review. Slot props are exempt: they pass through
 * children / VNodes and have no breakpoint-variant rendering surface.
 * Walks composite parts so `parts.<name>.props.<prop>` is covered too.
 */
export function checkResponsiveExplicit(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  visitNodes(spec, (node, path) => {
    for (const [propName, propDef] of Object.entries(node.props ?? {})) {
      if (propDef.slot === true) continue;
      if (propDef.responsive === undefined) {
        const propPath =
          path === "" ? `props.${propName}.responsive` : `${path}.props.${propName}.responsive`;
        issues.push(
          issue(
            spec.name,
            propPath,
            "non-slot prop must declare `responsive:` explicitly (`true` or `false`)",
          ),
        );
      }
    }
  });
  return issues;
}
