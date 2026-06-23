import { motionPlugin } from "../plugins/motion/index.ts";
import { tokensPlugin } from "../plugins/tokens/index.ts";
import { variantsPlugin } from "../plugins/variants/index.ts";
import type { SubstratePlugin } from "./plugin.ts";

/**
 * Plugins are evaluated in declared order. Earlier plugins' analyze()
 * contributions are visible to later plugins' analyze() AND to every
 * plugin's emit(). Plugins never import one another.
 */
export const PLUGINS: readonly SubstratePlugin[] = [motionPlugin, tokensPlugin, variantsPlugin];
