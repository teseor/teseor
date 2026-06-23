import { a11yPlugin } from "../plugins/a11y/index.ts";
import { coveragePlugin } from "../plugins/coverage/index.ts";
import { dependenciesPlugin } from "../plugins/dependencies/index.ts";
import { examplesPlugin } from "../plugins/examples/index.ts";
import { motionPlugin } from "../plugins/motion/index.ts";
import { propsPlugin } from "../plugins/props/index.ts";
import { tokensPlugin } from "../plugins/tokens/index.ts";
import { variantsPlugin } from "../plugins/variants/index.ts";
import { voidElementsPlugin } from "../plugins/voidElements/index.ts";
import type { SubstratePlugin } from "./plugin.ts";

/**
 * Plugins are evaluated in declared order. Earlier plugins' analyze()
 * contributions are visible to later plugins' analyze() AND to every
 * plugin's emit(). Plugins never import one another.
 */
export const PLUGINS: readonly SubstratePlugin[] = [
  motionPlugin,
  tokensPlugin,
  variantsPlugin,
  dependenciesPlugin,
  coveragePlugin,
  examplesPlugin,
  voidElementsPlugin,
  a11yPlugin,
  propsPlugin,
];
