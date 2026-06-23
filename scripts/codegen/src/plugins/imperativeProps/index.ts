import type { SubstratePlugin } from "../../core/plugin.ts";
import { imperativePropsRecord } from "./schema.ts";

export const imperativePropsPlugin: SubstratePlugin = {
  name: "imperativeProps",
  schema: {
    atomic: { imperativeProps: imperativePropsRecord },
  },
  emit: {},
};
