import type { SubstratePlugin } from "../../core/plugin.ts";
import { analyzeA11y } from "./analyze.ts";
import { checkA11yRefs } from "./check.ts";
import { a11yBlock } from "./schema.ts";

export const a11yPlugin: SubstratePlugin = {
  name: "a11y",
  schema: {
    atomic: { a11y: a11yBlock.optional() },
    part: { a11y: a11yBlock.optional() },
  },
  analyze: (spec) => analyzeA11y(spec),
  check: (spec) => checkA11yRefs(spec),
};
