import { a11yPlugin } from "../plugins/a11y/index.ts";
import { branchesPlugin } from "../plugins/branches/index.ts";
import { constraintsPlugin } from "../plugins/constraints/index.ts";
import { coveragePlugin } from "../plugins/coverage/index.ts";
import { defaultChildrenPlugin } from "../plugins/defaultChildren/index.ts";
import { dependenciesPlugin } from "../plugins/dependencies/index.ts";
import { elementByPropPlugin } from "../plugins/elementByProp/index.ts";
import { eventsPlugin } from "../plugins/events/index.ts";
import { examplesPlugin } from "../plugins/examples/index.ts";
import { formControlPlugin } from "../plugins/formControl/index.ts";
import { htmlAttrsPlugin } from "../plugins/htmlAttrs/index.ts";
import { imperativePropsPlugin } from "../plugins/imperativeProps/index.ts";
import { latchPlugin } from "../plugins/latch/index.ts";
import { motionPlugin } from "../plugins/motion/index.ts";
import { overlayPlugin } from "../plugins/overlay/index.ts";
import { partsPlugin } from "../plugins/parts/index.ts";
import { polymorphicPlugin } from "../plugins/polymorphic/index.ts";
import { propsPlugin } from "../plugins/props/index.ts";
import { rootElementStaticPlugin } from "../plugins/rootElementStatic/index.ts";
import { statesPlugin } from "../plugins/states/index.ts";
import { tokensPlugin } from "../plugins/tokens/index.ts";
import { variantsPlugin } from "../plugins/variants/index.ts";
import { vocabularyPlugin } from "../plugins/vocabulary/index.ts";
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
  formControlPlugin,
  imperativePropsPlugin,
  branchesPlugin,
  latchPlugin,
  htmlAttrsPlugin,
  defaultChildrenPlugin,
  polymorphicPlugin,
  elementByPropPlugin,
  rootElementStaticPlugin,
  eventsPlugin,
  vocabularyPlugin,
  constraintsPlugin,
  partsPlugin,
  statesPlugin,
  overlayPlugin,
];
