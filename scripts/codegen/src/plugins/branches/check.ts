import type { Issue } from "../../core/check-utils.ts";
import { issue } from "../../core/check-utils.ts";
import type { Spec } from "../../schema.ts";

/** Registry of compute-helper names allowed in `branches[*].text.compute`. New
 *  helpers land alongside their definition in both `_runtime.ts` templates. */
const BRANCH_COMPUTES: ReadonlySet<string> = new Set(["deriveInitials"]);

type BranchWhenShape =
  | { propTruthy?: string; propFalsy?: string; stateTruthy?: string; stateFalsy?: string }
  | { all?: BranchWhenShape[]; any?: BranchWhenShape[] };

function collectWhenRefs(
  clause: BranchWhenShape | undefined,
  out: { props: string[]; states: string[] },
): void {
  if (!clause) return;
  const c = clause as Record<string, unknown>;
  if (typeof c.propTruthy === "string") out.props.push(c.propTruthy);
  if (typeof c.propFalsy === "string") out.props.push(c.propFalsy);
  if (typeof c.stateTruthy === "string") out.states.push(c.stateTruthy);
  if (typeof c.stateFalsy === "string") out.states.push(c.stateFalsy);
  if (Array.isArray(c.all)) for (const sub of c.all) collectWhenRefs(sub, out);
  if (Array.isArray(c.any)) for (const sub of c.any) collectWhenRefs(sub, out);
}

/**
 * Validates `state:` declarations and `branches:` chains on atomic specs:
 *
 * - Every `when` clause must reference declared props (`propTruthy/Falsy`) or
 *   declared state (`stateTruthy/Falsy`).
 * - Every `attrs.<name>: { prop: X }` X must be a declared prop.
 * - Every `attrs.<name>: { setState: { name: X } }` X must be declared state.
 * - Every `text: { prop: X }` X must be a declared prop.
 * - Every `text: { compute: X, from: [Y...] }` X must be in BRANCH_COMPUTES,
 *   and every Y must be a declared prop.
 * - The LAST branch must omit `when` (the unconditional fallback). All earlier
 *   branches must declare `when`.
 */
export function checkBranches(spec: Spec): Issue[] {
  if (spec.kind !== "atomic") return [];
  const issues: Issue[] = [];
  const branches = spec.branches;
  const state = spec.latch ?? {};
  const props = spec.props ?? {};
  if (!branches || branches.length === 0) return issues;
  const lastIdx = branches.length - 1;
  branches.forEach((b, i) => {
    const base = `branches[${i}]`;
    if (i === lastIdx) {
      if (b.when !== undefined) {
        issues.push(
          issue(spec.name, base, `last branch must omit \`when\` (the unconditional fallback)`),
        );
      }
    } else if (b.when === undefined) {
      issues.push(
        issue(
          spec.name,
          base,
          `branch ${i} must declare \`when\` (only the last may be the fallback)`,
        ),
      );
    }
    const refs = { props: [] as string[], states: [] as string[] };
    collectWhenRefs(b.when, refs);
    for (const name of refs.props) {
      if (!(name in props)) {
        issues.push(
          issue(spec.name, `${base}.when`, `prop '${name}' is not declared on this spec`),
        );
      }
    }
    for (const name of refs.states) {
      if (!(name in state)) {
        issues.push(
          issue(spec.name, `${base}.when`, `state '${name}' is not declared on this spec`),
        );
      }
    }
    for (const [attr, value] of Object.entries(b.attrs ?? {})) {
      if ("prop" in value) {
        if (!(value.prop in props)) {
          issues.push(
            issue(
              spec.name,
              `${base}.attrs.${attr}`,
              `prop '${value.prop}' is not declared on this spec`,
            ),
          );
        }
      } else if ("setState" in value) {
        if (!(value.setState.name in state)) {
          issues.push(
            issue(
              spec.name,
              `${base}.attrs.${attr}`,
              `state '${value.setState.name}' is not declared on this spec`,
            ),
          );
        }
      }
    }
    if (b.text !== undefined) {
      if ("prop" in b.text) {
        if (!(b.text.prop in props)) {
          issues.push(
            issue(spec.name, `${base}.text`, `prop '${b.text.prop}' is not declared on this spec`),
          );
        }
      } else if ("compute" in b.text) {
        if (!BRANCH_COMPUTES.has(b.text.compute)) {
          issues.push(
            issue(
              spec.name,
              `${base}.text.compute`,
              `unknown compute helper '${b.text.compute}' — allowed: ${Array.from(BRANCH_COMPUTES).join(", ")}`,
            ),
          );
        }
        for (const from of b.text.from) {
          if (!(from in props)) {
            issues.push(
              issue(spec.name, `${base}.text.from`, `prop '${from}' is not declared on this spec`),
            );
          }
        }
      }
    }
  });
  return issues;
}
