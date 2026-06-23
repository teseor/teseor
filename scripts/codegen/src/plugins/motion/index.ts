import type { SubstratePlugin } from "../../core/plugin.ts";
import { checkMotion } from "./check.ts";
import { motionFragment } from "./schema.ts";

export const motionPlugin: SubstratePlugin = {
  name: "motion",
  schema: {
    atomic: { motion: motionFragment.optional() },
    composite: { motion: motionFragment.optional() },
    part: { motion: motionFragment.optional() },
  },
  check: (spec) => checkMotion(spec),
  emit: {},
};
