import type { SubstratePlugin } from "../../core/plugin.ts";
import { checkCoverageShape } from "./check.ts";
import { coverageBlock } from "./schema.ts";

export const coveragePlugin: SubstratePlugin = {
  name: "coverage",
  schema: {
    atomic: { coverage: coverageBlock.optional() },
    composite: { coverage: coverageBlock.optional() },
  },
  check: (spec) => checkCoverageShape(spec),
};
