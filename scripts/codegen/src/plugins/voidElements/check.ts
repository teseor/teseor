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

const FORM_CONTROL_VOIDS = new Set(["input"]);

// ── Void HTML elements reject child-bearing prop declarations ───────────────

/**
 * Void elements (`hr`, `img`, `input`, `br`, …) cannot have children, so
 * codegen emits the self-closing form. A spec author who declares slot props,
 * `loading`, or `as` on a void element gets no compile-time signal — the
 * codegen silently ignores them. Flag at spec-validation time so the dead
 * fields surface in review. `disabled` is rejected on non-form-control voids
 * (where it is a no-op) but accepted on `input` (where it carries native
 * semantics). Walks composite parts.
 */
export function checkVoidElementConstraints(spec: Spec): Issue[] {
  const issues: Issue[] = [];
  visitNodes(spec, (node, path) => {
    if (!node.element || !isVoidElement(node.element)) return;
    const tag = node.element;
    // `isVoidElement` lowercases its input; compare the FORM_CONTROL_VOIDS
    // membership the same way so `element: INPUT` is treated as `element: input`.
    const tagLower = tag.toLowerCase();
    const propsPath = (key: string) => (path === "" ? `props.${key}` : `${path}.props.${key}`);
    const slotProps = Object.entries(node.props ?? {})
      .filter(([, d]) => d.slot === true)
      .map(([n]) => n);
    for (const slot of slotProps) {
      issues.push(
        issue(spec.name, propsPath(slot), `void element <${tag}> cannot host slot props`),
      );
    }
    if ("loading" in (node.props ?? {})) {
      issues.push(
        issue(
          spec.name,
          propsPath("loading"),
          `void element <${tag}> cannot render a loading spinner child`,
        ),
      );
    }
    if ("as" in (node.props ?? {})) {
      issues.push(
        issue(
          spec.name,
          propsPath("as"),
          `void element <${tag}> cannot declare \`as\` — polymorphism to a non-void element breaks codegen-time void detection`,
        ),
      );
    }
    if ("disabled" in (node.props ?? {}) && !FORM_CONTROL_VOIDS.has(tagLower)) {
      issues.push(
        issue(
          spec.name,
          propsPath("disabled"),
          `void element <${tag}> ignores \`disabled\` (only form-control voids like <input> honor it)`,
        ),
      );
    }
  });
  return issues;
}
