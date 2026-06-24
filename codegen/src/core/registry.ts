import { a11yPlugin } from "../plugins/a11y/index.ts";
import { branchesPlugin } from "../plugins/branches/index.ts";
import { constraintsPlugin } from "../plugins/constraints/index.ts";
import { coveragePlugin } from "../plugins/coverage/index.ts";
import { defaultChildrenPlugin } from "../plugins/default-children/index.ts";
import { dependenciesPlugin } from "../plugins/dependencies/index.ts";
import { eventsPlugin } from "../plugins/events/index.ts";
import { examplesPlugin } from "../plugins/examples/index.ts";
import { formControlPlugin } from "../plugins/form-control/index.ts";
import { htmlAttrsPlugin } from "../plugins/html-attrs/index.ts";
import { imperativePropsPlugin } from "../plugins/imperative-props/index.ts";
import { latchPlugin } from "../plugins/latch/index.ts";
import { motionPlugin } from "../plugins/motion/index.ts";
import { overlayPlugin } from "../plugins/overlay/index.ts";
import { partsPlugin } from "../plugins/parts/index.ts";
import { propsPlugin } from "../plugins/props/index.ts";
import { rootPlugin } from "../plugins/root/index.ts";
import { statesPlugin } from "../plugins/states/index.ts";
import { tokensPlugin } from "../plugins/tokens/index.ts";
import { variantsPlugin } from "../plugins/variants/index.ts";
import { vocabularyPlugin } from "../plugins/vocabulary/index.ts";
import { voidElementsPlugin } from "../plugins/void-elements/index.ts";
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
  formControlPlugin,
  imperativePropsPlugin,
  branchesPlugin,
  latchPlugin,
  htmlAttrsPlugin,
  defaultChildrenPlugin,
  rootPlugin,
  eventsPlugin,
  vocabularyPlugin,
  constraintsPlugin,
  partsPlugin,
  statesPlugin,
  overlayPlugin,
];
