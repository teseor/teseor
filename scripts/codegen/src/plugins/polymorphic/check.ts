import { isVoidElement } from "../../lib/html-void-elements.ts";
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
 * The polymorphic `as` prop is a semantic element swap — Button is realistically
 * `button` or `a`, not "any HTML tag." Enforce that a spec declaring an `as`
 * prop also declares `values:` (a curated string-list), `type: string`, and
 * that `values:` covers the fallback element (the node's `element:`, which
 * codegen falls back to via `as ?? element`) and the prop's `default:` if set.
 * Walks composite parts.
 */
export function checkAsIsConstrained(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  visitNodes(spec, (node, path) => {
    const asProp = node.props?.as;
    if (!asProp) return;
    const propPath = path === "" ? "props.as" : `${path}.props.as`;
    if (asProp.type !== "string") {
      issues.push(
        issue(
          spec.name,
          `${propPath}.type`,
          "`as` must be declared as `type: string` so codegen can emit a typed union",
        ),
      );
    }
    if (!asProp.values || asProp.values.length === 0) {
      issues.push(
        issue(
          spec.name,
          `${propPath}.values`,
          "`as` must declare `values:` (a curated list of element names); custom components are not allowed",
        ),
      );
      return;
    }
    if (typeof node.element === "string" && !asProp.values.includes(node.element)) {
      issues.push(
        issue(
          spec.name,
          `${propPath}.values`,
          `must include the fallback element '${node.element}' (codegen falls back to it when \`as\` is omitted)`,
        ),
      );
    }
    if (typeof asProp.default === "string" && !asProp.values.includes(asProp.default)) {
      issues.push(
        issue(
          spec.name,
          `${propPath}.default`,
          `default '${asProp.default}' is not in values: [${asProp.values.join(", ")}]`,
        ),
      );
    }
  });
  return issues;
}

/**
 * Atomic specs may opt into Slot-based polymorphism with
 * `polymorphic: 'asChild'`. Two combinations are rejected:
 *
 * - `polymorphic` + a sibling `as` prop. `as` is the rejected pattern per
 *   the patterns doc §1.6; the two are mutually exclusive — declaring both
 *   on the same spec is a spec authoring error.
 * - `polymorphic` on a void-element root (`hr`, `img`, …). Slot expects a
 *   single child element to clone into; a void root has no children path,
 *   so Slot would always warn.
 */
export function checkPolymorphicAtomic(spec: Spec): Issue[] {
  if (!isAtomic(spec)) return [];
  if (spec.polymorphic !== "asChild") return [];
  const issues: Issue[] = [];
  // `as` as a free polymorphism control (`asElement(as ?? "div")`) collides
  // with `asChild` — two competing root-tag mechanisms. When `as` is the
  // closed `elementByProp` control instead, Slot wraps the resolved tag and
  // both mechanisms co-exist cleanly.
  const asIsElementByPropControl = spec.elementByProp?.prop === "as";
  if (spec.props && "as" in spec.props && !asIsElementByPropControl) {
    issues.push(
      issue(
        spec.name,
        "polymorphic",
        "`polymorphic: 'asChild'` is mutually exclusive with a sibling `as` prop — pick one polymorphism strategy",
      ),
    );
  }
  if (spec.props && "asChild" in spec.props) {
    issues.push(
      issue(
        spec.name,
        "props.asChild",
        "`asChild` is emitted automatically by the polymorphic flag; remove the declared prop or drop `polymorphic`",
      ),
    );
  }
  if (spec.element && isVoidElement(spec.element)) {
    issues.push(
      issue(
        spec.name,
        "polymorphic",
        `\`polymorphic: 'asChild'\` requires a child-bearing root element; '${spec.element}' is a void element`,
      ),
    );
  }
  return issues;
}
