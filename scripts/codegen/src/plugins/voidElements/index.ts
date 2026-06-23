import type { SubstratePlugin } from "../../core/plugin.ts";
import { analyzeVoidElements } from "./analyze.ts";
import { checkVoidElementConstraints } from "./check.ts";

export const voidElementsPlugin: SubstratePlugin = {
  name: "voidElements",
  schema: {},
  analyze: (spec) => analyzeVoidElements(spec),
  check: (spec) => checkVoidElementConstraints(spec),
  emit: {},
};
