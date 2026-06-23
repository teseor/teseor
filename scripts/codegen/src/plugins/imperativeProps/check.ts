import type { Vocabulary } from "../../lib/vocabulary.ts";
import type { AtomicSpec, Spec } from "../../schema.ts";
import type { Issue } from "../../semantic-checks.ts";

function isAtomic(spec: Spec): spec is AtomicSpec {
  return spec.kind === "atomic";
}

function issue(spec: string, path: string, message: string): Issue {
  return { spec, path, message };
}

const IMPERATIVE_RESERVED_NAMES = new Set([
  "as",
  "asChild",
  "children",
  "class",
  "className",
  "key",
  "ref",
  "style",
]);

/**
 * Imperative props (DOM-property setters like `<input>.indeterminate`) must
 * not collide with declared spec props or the formControl shared contract —
 * either would silently overwrite the other at the wrapper level.
 */
export function checkImperativeProps(spec: Spec, vocabulary: Vocabulary): Issue[] {
  if (!isAtomic(spec)) return [];
  const imperative = spec.imperativeProps;
  if (!imperative) return [];
  const issues: Issue[] = [];
  const specPropNames = new Set(Object.keys(spec.props ?? {}));
  const sharedFormControlNames =
    spec.formControl === true ? new Set(Object.keys(vocabulary.formControl.props)) : new Set();
  for (const name of Object.keys(imperative)) {
    if (specPropNames.has(name)) {
      issues.push(
        issue(
          spec.name,
          `imperativeProps.${name}`,
          `'${name}' is already declared in props — remove one; imperative props and spec props can't share a name`,
        ),
      );
    }
    if (sharedFormControlNames.has(name)) {
      issues.push(
        issue(
          spec.name,
          `imperativeProps.${name}`,
          `'${name}' is part of the formControl shared contract — pick a different name for the imperative DOM-property setter`,
        ),
      );
    }
    if (IMPERATIVE_RESERVED_NAMES.has(name)) {
      issues.push(
        issue(
          spec.name,
          `imperativeProps.${name}`,
          `'${name}' is reserved by the wrapper template (React/Vue intrinsics) — pick a different name`,
        ),
      );
    }
  }
  return issues;
}
