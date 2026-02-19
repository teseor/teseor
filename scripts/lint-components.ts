#!/usr/bin/env tsx
// Lint runner — imports and calls all lint checks in order.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { lintApiSync } from './lints/api-sync.js';
import { lintBareTokenVars } from './lints/bare-token-vars.js';
import { lintComponents } from './lints/component-files.js';
import { lintDocsContent } from './lints/docs-content.js';
import { lintI18nCoverage } from './lints/i18n-coverage.js';
import { lintSidenavCompleteness } from './lints/sidenav-completeness.js';
import { lintStyleLayerTokens } from './lints/style-layer-tokens.js';
import { lintTokenDictionary } from './lints/token-dictionary.js';
import { lintTokenFallbacks } from './lints/token-fallbacks.js';
import { lintTokenNames } from './lints/token-names.js';
import { lintWrongLayerTokens } from './lints/wrong-layer-tokens.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = join(__dirname, '../packages/css/src/components');
const SRC_DIR = join(__dirname, '../packages/css/src');
const APPS_DIR = join(__dirname, '../apps');
const CONFIG_PATH = join(__dirname, '../packages/css/component-groups.config.json');

lintComponents(COMPONENTS_DIR);
lintSidenavCompleteness(COMPONENTS_DIR, CONFIG_PATH);
lintDocsContent(COMPONENTS_DIR);
lintTokenFallbacks(SRC_DIR);
lintBareTokenVars(SRC_DIR);
lintWrongLayerTokens(SRC_DIR);
lintStyleLayerTokens(SRC_DIR);
lintTokenNames(SRC_DIR);
lintTokenDictionary(SRC_DIR, APPS_DIR);
lintApiSync();
lintI18nCoverage(SRC_DIR);
