import type { SubstratePlugin } from "../../core/plugin.ts";
import { checkRepeatingParts } from "./check.ts";

export const partsPlugin: SubstratePlugin = {
  name: "parts",
  schema: {},
  check: (spec) => checkRepeatingParts(spec),
};
