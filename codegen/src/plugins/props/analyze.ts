import type { SpecAnalysis } from "../../core/analysis.ts";
import { visitAllNodes } from "../../core/check-utils.ts";
import type { Spec, SpecPart } from "../../core/schema.ts";

type PropMap = NonNullable<SpecPart["props"]>;

export function analyzeProps(spec: Spec): Partial<SpecAnalysis> {
  const responsive = new Set<string>();
  const slot = new Set<string>();
  const controllable = new Set<string>();
  let hasAs = false;
  let hasDisabled = false;
  let hasLoading = false;

  const visit = (props: PropMap | undefined): void => {
    if (!props) return;
    for (const [name, def] of Object.entries(props)) {
      if (def.responsive === true) responsive.add(name);
      if (def.slot === true) slot.add(name);
      if (def.pattern === "controllable") controllable.add(name);
      if (name === "as") hasAs = true;
      if (name === "disabled") hasDisabled = true;
      if (name === "loading") hasLoading = true;
    }
  };

  visitAllNodes(spec, (node) => {
    visit(node.props);
  });

  return {
    responsivePropNames: responsive,
    slotPropNames: slot,
    controllablePropNames: controllable,
    hasAs,
    hasDisabled,
    hasLoading,
  };
}
