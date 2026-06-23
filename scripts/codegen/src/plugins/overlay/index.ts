import type { SubstratePlugin } from "../../core/plugin.ts";
import { overlayBlock } from "./schema.ts";

export const overlayPlugin: SubstratePlugin = {
  name: "overlay",
  schema: {
    part: { overlay: overlayBlock.optional() },
  },
  emit: {},
};
