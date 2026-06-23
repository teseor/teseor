import type { Issue } from "../../core/check-utils.ts";
import { issue, visitNodes } from "../../core/check-utils.ts";
import type { Spec } from "../../schema.ts";

/**
 * `a11y.ariaProps[i]` must reference a declared `type: 'string'`, non-
 * responsive prop on the same node — the generator emits
 * `aria-{name}={name}` and the value flows through verbatim, so the prop's
 * type must align with the aria attribute's enumeration domain.
 *
 * `a11y.decorativeProp` must reference a declared `type: 'boolean'` prop —
 * the generator branches on `=== true` to toggle `role="none"` and
 * `aria-hidden="true"`.
 *
 * `a11y.labelProp` must reference a declared `type: 'string'`, non-
 * responsive prop — the generator emits `aria-label={prop}` when set and
 * `aria-hidden="true"` (plus role override to `"none"` when a base role is
 * declared) when unset. Mutually exclusive with `decorativeProp` — the two
 * encode opposite a11y defaults (meaningful-by-default vs decorative-by-
 * default) and would contradict each other on the same root.
 */
export function checkA11yRefs(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  visitNodes(spec, (node, path) => {
    const a11y = node.a11y;
    if (!a11y) return;
    const base = path === "" ? "a11y" : `${path}.a11y`;
    const props = node.props ?? {};
    for (const name of a11y.ariaProps ?? []) {
      const prop = props[name];
      if (!prop) {
        issues.push(
          issue(spec.name, `${base}.ariaProps`, `prop '${name}' is not declared on this node`),
        );
        continue;
      }
      if (prop.type !== "string") {
        issues.push(
          issue(
            spec.name,
            `${base}.ariaProps`,
            `prop '${name}' must be \`type: 'string'\`; got '${prop.type}'`,
          ),
        );
      }
      if (prop.responsive === true) {
        issues.push(
          issue(
            spec.name,
            `${base}.ariaProps`,
            `prop '${name}' must be non-responsive (the aria attribute is emitted once on the root)`,
          ),
        );
      }
    }
    const dec = a11y.decorativeProp;
    if (dec !== undefined) {
      const prop = props[dec];
      if (!prop) {
        issues.push(
          issue(spec.name, `${base}.decorativeProp`, `prop '${dec}' is not declared on this node`),
        );
      } else if (prop.type !== "boolean") {
        issues.push(
          issue(
            spec.name,
            `${base}.decorativeProp`,
            `prop '${dec}' must be \`type: 'boolean'\`; got '${prop.type}'`,
          ),
        );
      }
    }
    const lbl = a11y.labelProp;
    if (lbl !== undefined) {
      const prop = props[lbl];
      if (!prop) {
        issues.push(
          issue(spec.name, `${base}.labelProp`, `prop '${lbl}' is not declared on this node`),
        );
      } else {
        if (prop.type !== "string") {
          issues.push(
            issue(
              spec.name,
              `${base}.labelProp`,
              `prop '${lbl}' must be \`type: 'string'\`; got '${prop.type}'`,
            ),
          );
        }
        if (prop.responsive === true) {
          issues.push(
            issue(
              spec.name,
              `${base}.labelProp`,
              `prop '${lbl}' must be non-responsive (aria-label is emitted once on the root)`,
            ),
          );
        }
      }
      if (dec !== undefined) {
        issues.push(
          issue(
            spec.name,
            `${base}`,
            `'decorativeProp' and 'labelProp' are mutually exclusive — pick one (decorative-by-default vs meaningful-by-default)`,
          ),
        );
      }
    }
  });
  return issues;
}
