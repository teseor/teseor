import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";
import { checkConstraintsAgainstCoverage, checkConstraintsAgainstExamples } from "./check.ts";
import { constraintEntry } from "./schema.ts";

const constraintsRecord = z.array(constraintEntry).optional();

export const constraintsPlugin: SubstratePlugin = {
  name: "constraints",
  schema: {
    atomic: { constraints: constraintsRecord },
    part: { constraints: constraintsRecord },
  },
  check: (spec) => [
    ...checkConstraintsAgainstExamples(spec),
    ...checkConstraintsAgainstCoverage(spec),
  ],
};
