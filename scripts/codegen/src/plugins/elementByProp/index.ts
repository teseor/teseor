import type { SubstratePlugin } from "../../core/plugin.ts";
import { analyzeElementByProp } from "./analyze.ts";
import { checkElementByProp } from "./check.ts";
import { elementByPropBlock } from "./schema.ts";

export const elementByPropPlugin: SubstratePlugin = {
  name: "elementByProp",
  schema: {
    atomic: { elementByProp: elementByPropBlock.optional() },
    part: { elementByProp: elementByPropBlock.optional() },
  },
  analyze: (spec) => analyzeElementByProp(spec),
  check: (spec) => checkElementByProp(spec),
  emit: {},
};
