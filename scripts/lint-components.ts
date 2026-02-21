#!/usr/bin/env tsx
// Lint runner — imports and calls all lint checks in order.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { lintAnnotationCompleteness } from './lints/annotation-completeness.js';
import { lintApiSync } from './lints/api-sync.js';
import { lintBareTokenVars } from './lints/bare-token-vars.js';
import { lintComponents } from './lints/component-files.js';
import { lintContentSync } from './lints/content-sync.js';
import { lintContentValidation } from './lints/content-validation.js';
import { lintNoComputationInTokens } from './lints/no-computation-in-tokens.js';
import { lintPackageBoundaries } from './lints/package-boundaries.js';
import { lintSidenavCompleteness } from './lints/sidenav-completeness.js';
import { lintStyleLayerTokens } from './lints/style-layer-tokens.js';
import { lintThreeTierFallbacks } from './lints/three-tier-fallbacks.js';
import { lintTokenDictionary } from './lints/token-dictionary.js';
import { lintTokenFallbacks } from './lints/token-fallbacks.js';
import { lintTokenNames } from './lints/token-names.js';
import { lintVersionSync } from './lints/version-sync.js';
import { lintWrongLayerTokens } from './lints/wrong-layer-tokens.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = __dirname;
const COMPONENTS_DIR = join(__dirname, '../packages/css/src/components');
const SRC_DIR = join(__dirname, '../packages/css/src');
const APPS_DIR = join(__dirname, '../apps');
const CONFIG_PATH = join(__dirname, '../packages/css/component-groups.config.json');

lintComponents(COMPONENTS_DIR);
lintSidenavCompleteness(COMPONENTS_DIR, CONFIG_PATH);
lintTokenFallbacks(SRC_DIR);
lintBareTokenVars(SRC_DIR);
lintWrongLayerTokens(SRC_DIR);
lintStyleLayerTokens(SRC_DIR);
lintTokenNames(SRC_DIR);
lintThreeTierFallbacks(SRC_DIR);
lintTokenDictionary(SRC_DIR, APPS_DIR);
lintAnnotationCompleteness(COMPONENTS_DIR);
lintNoComputationInTokens(SRC_DIR);
lintApiSync();
lintContentSync();
lintContentValidation(SRC_DIR);
lintPackageBoundaries(SCRIPTS_DIR);
lintVersionSync();
