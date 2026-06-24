import type { Issue } from "../../../core/check-utils.ts";
import { issue } from "../../../core/check-utils.ts";
import type { SpecPart } from "../../../schema.ts";

// Rules 15 and 16 — checks for a single non-repeating part.
export function checkNonRepeatingPart(
  specName: string,
  partName: string,
  part: SpecPart,
  path: string,
  anyRepeating: boolean,
  issues: Issue[],
): void {
  // Rule 15: `propName:` and `groupKey:` are only consumed when
  // `repeating: true`. Either on a non-repeating part is silently
  // ignored downstream.
  if (part.propName !== undefined) {
    issues.push(
      issue(
        specName,
        path,
        `non-repeating part '${partName}' cannot declare \`propName:\` — it is only consumed for parts with \`repeating: true\`.`,
      ),
    );
  }
  if (part.groupKey !== undefined) {
    issues.push(
      issue(
        specName,
        path,
        `non-repeating part '${partName}' cannot declare \`groupKey:\` — it is only consumed for parts with \`repeating: true\`.`,
      ),
    );
  }
  // Rule 16: in a list composite, group-level scalar props on a
  // non-repeating sibling cannot use advanced shapes that the wrapper
  // template doesn't currently handle. The wrapper just passes props
  // through (React `{...rest}`, Vue `:<name>="<name>"`) — no per-
  // breakpoint expansion, no slot rendering, no controllable triple.
  //   16a: `responsive: true` — no `responsiveDataAttrs` expansion.
  //   16b: `slot: true` — wrapper has no body for slot content.
  //   16c: `pattern: controllable` — no `default*` / `on*Change` triple.
  if (anyRepeating) {
    for (const [propName, def] of Object.entries(part.props ?? {})) {
      if (def.responsive === true) {
        issues.push(
          issue(
            specName,
            `${path}.props.${propName}`,
            `group-level scalar prop '${propName}' on non-repeating part '${partName}' cannot set \`responsive: true\` — wrapper props flow through without responsive expansion.`,
          ),
        );
      }
      if (def.slot === true) {
        issues.push(
          issue(
            specName,
            `${path}.props.${propName}`,
            `group-level scalar prop '${propName}' on non-repeating part '${partName}' cannot set \`slot: true\` — the wrapper renders the repeating loop, not slot content.`,
          ),
        );
      }
      if (def.pattern === "controllable") {
        issues.push(
          issue(
            specName,
            `${path}.props.${propName}`,
            `group-level scalar prop '${propName}' on non-repeating part '${partName}' cannot set \`pattern: controllable\` — the wrapper template doesn't emit the \`default<Name>\` / \`on<Name>Change\` triple. Controllable patterns wait for an events story.`,
          ),
        );
      }
    }
  }
}
