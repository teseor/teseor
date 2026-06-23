import type { SubstratePlugin } from "../../core/plugin.ts";
import { analyzeRoot } from "./analyze.ts";
import { checkRoot } from "./check.ts";
import { rootFragment } from "./schema.ts";

export const rootPlugin: SubstratePlugin = {
  name: "root",
  schema: {
    atomic: { root: rootFragment.optional() },
    part: { root: rootFragment.optional() },
  },
  analyze: analyzeRoot,
  check: checkRoot,
};
