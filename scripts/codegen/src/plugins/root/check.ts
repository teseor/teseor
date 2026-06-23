import type { Issue } from "../../core/check-utils.ts";
import { isAtomic, issue, visitNodes } from "../../core/check-utils.ts";
import { isVoidElement } from "../../lib/html-void-elements.ts";
import type { Spec } from "../../schema.ts";

/**
 * `root.kind: byProp` resolves the rendered tag at runtime from a controlling
 * prop's value. Four rules keep the generator output sound:
 *
 * - The named prop must exist on the same node.
 * - The named prop must be `type: 'string'` — boolean / number / responsive
 *   prop types are out of scope for the v1 surface.
 * - The named prop's `values:` must enumerate exactly the map's keys (any
 *   value the consumer can pass must hit the map; every map key must be a
 *   valid prop value).
 * - The map must declare at least one entry.
 *
 * Walks atomic root + composite parts via `visitNodes`.
 */
function checkRootByProp(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  visitNodes(spec, (node, path) => {
    const root = node.root;
    if (root?.kind !== "byProp") return;
    const base = path === "" ? "root" : `${path}.root`;
    const controllingProp = node.props?.[root.prop];
    if (!controllingProp) {
      issues.push(
        issue(spec.name, `${base}.prop`, `prop '${root.prop}' is not declared on this node`),
      );
      return;
    }
    if (controllingProp.type !== "string") {
      issues.push(
        issue(
          spec.name,
          `${base}.prop`,
          `prop '${root.prop}' must be \`type: 'string'\`; got '${controllingProp.type}'`,
        ),
      );
    }
    const mapKeys = Object.keys(root.map).sort();
    const values = (controllingProp.values ?? []).slice().sort();
    if (mapKeys.length === 0) {
      issues.push(issue(spec.name, `${base}.map`, "`map` must declare at least one entry"));
    }
    const missingFromMap = values.filter((v) => !Object.hasOwn(root.map, v));
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
          `map key(s) [${missingFromValues.join(", ")}] are not declared in \`${root.prop}.values\``,
        ),
      );
    }
  });
  return issues;
}

/**
 * The polymorphic `as` prop is a semantic element swap — Button is realistically
 * `button` or `a`, not "any HTML tag." Enforce that a spec declaring an `as`
 * prop also declares `values:` (a curated string-list), `type: string`, and
 * that `values:` covers the fallback element (the node's `root.tag` for a
 * static kind, which codegen falls back to via `as ?? tag`) and the prop's
 * `default:` if set. Walks composite parts.
 */
function checkAsIsConstrained(spec: Spec): Issue[] {
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
    const root = node.root;
    const fallbackTag = root?.kind === "static" ? root.tag : undefined;
    if (fallbackTag !== undefined && !asProp.values.includes(fallbackTag)) {
      issues.push(
        issue(
          spec.name,
          `${propPath}.values`,
          `must include the fallback element '${fallbackTag}' (codegen falls back to it when \`as\` is omitted)`,
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
 * `root.polymorphic: 'asChild'`. Two combinations are rejected:
 *
 * - `polymorphic` + a sibling `as` prop. `as` is the rejected pattern per
 *   the patterns doc §1.6; the two are mutually exclusive — declaring both
 *   on the same spec is a spec authoring error. The carve-out: when `as` is
 *   the `byProp` control itself, Slot wraps the resolved tag and both
 *   mechanisms co-exist cleanly.
 * - A sibling `asChild` declared prop. `asChild` is emitted automatically by
 *   the polymorphic flag.
 * - `polymorphic` on a void-element root (`hr`, `img`, …). Slot expects a
 *   single child element to clone into; a void root has no children path,
 *   so Slot would always warn.
 */
function checkPolymorphicAtomic(spec: Spec): Issue[] {
  if (!isAtomic(spec)) return [];
  const root = spec.root;
  if (root?.polymorphic !== "asChild") return [];
  const issues: Issue[] = [];
  // `as` as a free polymorphism control (`asElement(as ?? "div")`) collides
  // with `asChild` — two competing root-tag mechanisms. When `as` is the
  // closed `byProp` control instead, Slot wraps the resolved tag and both
  // mechanisms co-exist cleanly.
  const asIsByPropControl = root.kind === "byProp" && root.prop === "as";
  if (spec.props && "as" in spec.props && !asIsByPropControl) {
    issues.push(
      issue(
        spec.name,
        "root.polymorphic",
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
  if (root.kind === "static" && isVoidElement(root.tag)) {
    issues.push(
      issue(
        spec.name,
        "root.polymorphic",
        `\`polymorphic: 'asChild'\` requires a child-bearing root element; '${root.tag}' is a void element`,
      ),
    );
  }
  return issues;
}

/**
 * Consolidated `root:` validation. Each branch preserves the rules of one of
 * the three predecessors (`elementByProp`, `as`-constrained, `polymorphic`),
 * rewritten against the unified `root: { kind }` shape.
 */
export function checkRoot(spec: Spec): Issue[] {
  return [...checkRootByProp(spec), ...checkAsIsConstrained(spec), ...checkPolymorphicAtomic(spec)];
}
