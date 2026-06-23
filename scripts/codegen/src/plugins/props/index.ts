import { z } from "zod";
import type { SubstratePlugin } from "../../core/plugin.ts";
import { analyzeProps } from "./analyze.ts";
import { checkResponsiveExplicit } from "./check.ts";
import { propEntry } from "./schema.ts";

const propsRecord = z.record(z.string(), propEntry).optional();

export const propsPlugin: SubstratePlugin = {
  name: "props",
  schema: {
    atomic: { props: propsRecord },
    part: { props: propsRecord },
  },
  analyze: (spec) => analyzeProps(spec),
  check: (spec) => checkResponsiveExplicit(spec),
  emit: {},
};
