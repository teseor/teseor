#!/usr/bin/env tsx
/**
 * Lint Components
 * Validates that all component folders have the required files:
 * - index.scss (styles)
 * - api.json (API definition)
 * - docs.html (documentation)
 *
 * Scans category subdirectories under components/
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { discoverComponents } from './discover-structure.js';
import { findComponentDirs } from './shared/find-components.js';
import {
  extractAllTokenRefs,
  extractBareTokenVars,
  extractDynamicTokenPrefixes,
  extractPropertyDeclarations,
  extractTokenDefinitions,
  extractTokenVars,
  extractWrongLayerTokens,
  isHardcodedFallback,
} from './shared/lint-helpers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = join(__dirname, '../packages/css/src/components');

interface FileCheck {
  pattern: string;
  description: string;
  required: boolean;
}

const REQUIRED_FILES: FileCheck[] = [
  { pattern: 'index.scss', description: 'styles', required: true },
  { pattern: 'api.json', description: 'API definition', required: true },
  { pattern: 'docs.html', description: 'documentation', required: true },
];

function checkGlobPattern(dir: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return existsSync(join(dir, pattern));
  }
  const files = readdirSync(dir);
  const regex = new RegExp(`^${pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
  return files.some((f) => regex.test(f));
}

function lintComponents(): void {
  const components = findComponentDirs(COMPONENTS_DIR);
  const errors: { component: string; missing: { pattern: string; description: string }[] }[] = [];
  const warnings: { component: string; optional: { pattern: string; description: string }[] }[] =
    [];

  for (const { name, path } of components) {
    const missing: { pattern: string; description: string }[] = [];
    const optional: { pattern: string; description: string }[] = [];

    for (const { pattern, description, required } of REQUIRED_FILES) {
      if (!checkGlobPattern(path, pattern)) {
        if (required) {
          missing.push({ pattern, description });
        } else {
          optional.push({ pattern, description });
        }
      }
    }

    if (missing.length > 0) {
      errors.push({ component: name, missing });
    }
    if (optional.length > 0) {
      warnings.push({ component: name, optional });
    }
  }

  if (warnings.length > 0) {
    console.warn('Component completeness warnings:\n');
    for (const { component, optional } of warnings) {
      console.warn(`  ${component}/`);
      for (const { pattern, description } of optional) {
        console.warn(`    - missing ${pattern} (${description})`);
      }
    }
    console.warn(`\n${warnings.length} component(s) missing optional files.\n`);
  }

  if (errors.length > 0) {
    console.error('Component completeness check failed:\n');
    for (const { component, missing } of errors) {
      console.error(`  ${component}/`);
      for (const { pattern, description } of missing) {
        console.error(`    - missing ${pattern} (${description})`);
      }
    }
    console.error(`\n${errors.length} component(s) incomplete.`);
    console.error('Run: pnpm new:component <name> to scaffold new components');
    process.exit(1);
  }

  console.log(`All ${components.length} components have required files.`);
}

function lintSidenavCompleteness(): void {
  const configPath = join(__dirname, '../packages/css/component-groups.config.json');
  let config: { groupOrder: string[] };
  try {
    config = JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch (e) {
    console.error(`Failed to parse ${configPath}: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
  const discovered = discoverComponents(COMPONENTS_DIR);
  const errors: string[] = [];

  // Every group in config should exist on disk
  for (const id of config.groupOrder) {
    if (!discovered.has(id)) {
      errors.push(`Config references group "${id}" but no directory found on disk`);
    }
  }

  // Every group on disk should be in config
  for (const id of discovered.keys()) {
    if (!config.groupOrder.includes(id)) {
      errors.push(`Group "${id}" found on disk but missing from component-groups.config.json`);
    }
  }

  // Every component with docs should be inside a known group
  const allDiscoveredComponents: { name: string; group: string }[] = [];
  for (const [groupId, group] of discovered) {
    for (const name of group.components) {
      allDiscoveredComponents.push({ name, group: groupId });
    }
  }

  if (errors.length > 0) {
    console.error('Sidenav completeness check failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error('');
    process.exit(1);
  }

  console.log(
    `Sidenav coverage: ${allDiscoveredComponents.length} components across ${discovered.size} groups.`,
  );
}

interface ApiJson {
  name?: string;
  [key: string]: unknown;
}

function lintDocsContent(): void {
  const components = findComponentDirs(COMPONENTS_DIR);
  const errors: string[] = [];

  for (const { name, path } of components) {
    // Validate api.json
    const apiFiles = readdirSync(path).filter((f) => f === 'api.json');
    for (const apiFile of apiFiles) {
      const raw = readFileSync(join(path, apiFile), 'utf-8');

      if (raw.includes('#{')) {
        errors.push(
          `${name}/${apiFile}: contains SCSS interpolation "#{" — values must be resolved`,
        );
      }

      let data: ApiJson;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        errors.push(`${name}/${apiFile}: invalid JSON — ${e instanceof Error ? e.message : e}`);
        continue;
      }
      if (!data.name) {
        errors.push(`${name}/${apiFile}: missing required "name" field`);
      }
      if (data.name && !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(data.name)) {
        errors.push(`${name}/${apiFile}: "name" must be kebab-case`);
      }
    }

    // Validate docs.html
    const docsHtmlFiles = readdirSync(path).filter((f) => f === 'docs.html');
    for (const docsFile of docsHtmlFiles) {
      const raw = readFileSync(join(path, docsFile), 'utf-8');
      const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) {
        errors.push(`${name}/${docsFile}: missing YAML frontmatter (--- delimiters)`);
        continue;
      }
      const fm = fmMatch[1];
      if (!/^title:\s*.+/m.test(fm)) {
        errors.push(`${name}/${docsFile}: missing required "title" in frontmatter`);
      }
      const apiMatch = fm.match(/^api:\s*(.+)/m);
      if (apiMatch) {
        const apiRef = apiMatch[1].trim();
        if (!existsSync(join(path, apiRef))) {
          errors.push(`${name}/${docsFile}: api path "${apiRef}" does not exist`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error('Docs content validation failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(`\n${errors.length} validation error(s).`);
    process.exit(1);
  }

  console.log(`Docs validation: ${components.length} components passed.`);
}

function lintTokenFallbacks(): void {
  const srcDir = join(__dirname, '../packages/css/src');
  const scssFiles = findScssFiles(srcDir);
  const errors: string[] = [];

  for (const file of scssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');
    // Skip token definition files — they define the values, not consume them
    if (relPath.startsWith('config/')) continue;
    // Skip debug tools — development utilities, not shipped components
    if (relPath.startsWith('debug/')) continue;

    const vars = extractTokenVars(content);
    for (const { token, fallback, index } of vars) {
      if (isHardcodedFallback(fallback)) {
        const line = content.substring(0, index).split('\n').length;
        errors.push(
          `${relPath}:${line}: var(--ui-${token}) has hardcoded fallback "${fallback}" — use SCSS variable reference`,
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error('Hardcoded token fallback check failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(
      `\n${errors.length} hardcoded fallback(s) found. Use #{t.$variable} instead of literal values.`,
    );
    process.exit(1);
  }

  console.log(`Token fallbacks: ${scssFiles.length} SCSS files passed.`);
}

function findScssFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findScssFiles(fullPath));
    } else if (entry.name.endsWith('.scss')) {
      results.push(fullPath);
    }
  }
  return results;
}

function lintStyleLayerTokens(): void {
  const srcDir = join(__dirname, '../packages/css/src');
  const errors: string[] = [];

  // Only check component and layout SCSS files
  const dirs = [join(srcDir, 'components'), join(srcDir, 'layout')];
  const scssFiles = dirs.flatMap((d) => findScssFiles(d));

  // Layers where var(--ui-*) should NOT appear (only var(--_*) allowed)
  const stylesLayerPatterns = ['@layer components.styles', '@layer primitives'];

  for (const file of scssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');

    // Collect @property-registered names to allow in styles layer
    const propertyDecls = extractPropertyDeclarations(content);

    // Find each styles layer block and check for var(--ui-*) inside
    for (const layerName of stylesLayerPatterns) {
      let searchFrom = 0;
      while (searchFrom < content.length) {
        const layerStart = content.indexOf(layerName, searchFrom);
        if (layerStart === -1) break;

        // Find the opening brace
        const braceStart = content.indexOf('{', layerStart);
        if (braceStart === -1) break;

        // Find matching closing brace with depth tracking
        let depth = 1;
        let pos = braceStart + 1;
        while (pos < content.length && depth > 0) {
          if (content[pos] === '{') depth++;
          else if (content[pos] === '}') depth--;
          pos++;
        }
        const layerBody = content.substring(braceStart + 1, pos - 1);
        const layerBodyStart = braceStart + 1;

        // Find all var(--ui-*) inside this layer block
        // Skip lines that are --_ custom property declarations (modifier overrides are allowed)
        const lines = layerBody.split('\n');
        let charOffset = 0;
        for (const rawLine of lines) {
          // Skip custom property declarations — these are token assignments, not property usage
          const isCustomPropDecl = /^\s*--[\w_-]+\s*:/.test(rawLine);
          if (!isCustomPropDecl) {
            const tokenPattern = /var\(--ui-[\w-]+/g;
            for (
              let match = tokenPattern.exec(rawLine);
              match !== null;
              match = tokenPattern.exec(rawLine)
            ) {
              const tokenName = match[0].replace('var(', '');
              // Allow @property-registered typed properties in styles layer
              if (propertyDecls.has(tokenName)) continue;
              const absoluteIdx = layerBodyStart + charOffset + match.index;
              const line = content.substring(0, absoluteIdx).split('\n').length;
              errors.push(
                `${relPath}:${line}: ${tokenName} used directly in styles layer — extract to --_ internal variable in tokens layer`,
              );
            }
          }
          charOffset += rawLine.length + 1; // +1 for newline
        }

        searchFrom = pos;
      }
    }
  }

  if (errors.length > 0) {
    console.error('Style layer token encapsulation check failed:\n');
    const byFile = new Map<string, number>();
    for (const err of errors) {
      const file = err.split(':')[0];
      byFile.set(file, (byFile.get(file) ?? 0) + 1);
    }
    for (const [file, count] of byFile) {
      console.error(`  ${file} (${count})`);
    }
    console.error(
      `\n${errors.length} direct token reference(s) in ${byFile.size} files. Move to @layer components.tokens as --_ internal variables.`,
    );
    process.exit(1);
  } else {
    console.log(`Style layer tokens: ${scssFiles.length} SCSS files passed.`);
  }
}

function lintApiSync(): void {
  try {
    execSync('tsx scripts/generate-api.ts -- --check', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    console.log('API sync: all api.json files up to date.');
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string };
    const output = (error.stdout || '') + (error.stderr || '');
    console.error(output);
    process.exit(1);
  }
}

function lintBareTokenVars(): void {
  const srcDir = join(__dirname, '../packages/css/src');
  const errors: string[] = [];

  // Only check component SCSS files — utilities/base/layout use bare vars intentionally
  const componentScssFiles = findScssFiles(join(srcDir, 'components'));

  for (const file of componentScssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');

    const bareVars = extractBareTokenVars(content);
    for (const { token, index } of bareVars) {
      const line = content.substring(0, index).split('\n').length;
      errors.push(
        `${relPath}:${line}: var(--ui-${token}) has no fallback — add SCSS variable reference e.g. var(--ui-${token}, \#{t.$...})`,
      );
    }
  }

  if (errors.length > 0) {
    console.error('Bare token variable check failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(
      `\n${errors.length} bare token var(s) found in components. Every var(--ui-*) in components must have a fallback.`,
    );
    process.exit(1);
  }

  console.log(`Bare token vars: ${componentScssFiles.length} component SCSS files passed.`);
}

function lintWrongLayerTokens(): void {
  const srcDir = join(__dirname, '../packages/css/src');
  const errors: string[] = [];

  const dirs = [join(srcDir, 'components'), join(srcDir, 'layout')];
  const scssFiles = dirs.flatMap((d) => findScssFiles(d));

  for (const file of scssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');

    const wrongTokens = extractWrongLayerTokens(content);
    for (const { varName, index } of wrongTokens) {
      const line = content.substring(0, index).split('\n').length;
      errors.push(
        `${relPath}:${line}: ${varName} defined in styles layer — move to @layer components.tokens`,
      );
    }
  }

  if (errors.length > 0) {
    console.error('Wrong-layer token definition check failed:\n');
    const byFile = new Map<string, number>();
    for (const err of errors) {
      const file = err.split(':')[0];
      byFile.set(file, (byFile.get(file) ?? 0) + 1);
    }
    for (const [file, count] of byFile) {
      console.error(`  ${file} (${count})`);
    }
    console.error(
      `\n${errors.length} token definition(s) in ${byFile.size} files. Move --_ definitions to @layer components.tokens.`,
    );
    process.exit(1);
  } else {
    console.log(`Wrong-layer tokens: ${scssFiles.length} SCSS files passed.`);
  }
}

function lintTokenNames(): void {
  const srcDir = join(__dirname, '../packages/css/src');
  const tokensDir = join(srcDir, 'config/tokens');
  const errors: string[] = [];

  // Build registry of known global token names from config/tokens/**/*.scss
  const globalTokens = new Set<string>();
  for (const file of findScssFiles(tokensDir)) {
    const content = readFileSync(file, 'utf-8');
    for (const token of extractTokenDefinitions(content)) {
      globalTokens.add(token);
    }
  }

  // Also scan all SCSS for --ui-*: definitions (captures cross-component tokens like --ui-ctx-*)
  const allScssFiles = findScssFiles(srcDir);
  const dynamicPrefixes = new Set<string>();
  for (const file of allScssFiles) {
    const content = readFileSync(file, 'utf-8');
    for (const token of extractTokenDefinitions(content)) {
      globalTokens.add(token);
    }
    for (const prefix of extractDynamicTokenPrefixes(content)) {
      dynamicPrefixes.add(prefix);
    }
  }

  // Scan component SCSS files for var(--ui-*) references
  const componentScssFiles = findScssFiles(join(srcDir, 'components'));
  for (const file of componentScssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');

    // Derive component name from directory (e.g. components/actions/button -> button)
    const parts = relPath.split('/');
    const componentName = parts[parts.length - 2];

    // @property-registered names are valid (typed custom properties)
    const propertyDecls = extractPropertyDeclarations(content);

    const refs = extractAllTokenRefs(content);
    for (const { token, index } of refs) {
      const fullName = `--ui-${token}`;
      // Skip @property-registered typed properties
      if (propertyDecls.has(fullName)) continue;
      // Skip SCSS-interpolated refs (token name ends with - from #{...})
      if (token.endsWith('-')) continue;
      // Valid if: known global token OR component-scoped (--ui-{componentName}-*)
      if (globalTokens.has(token)) continue;
      if (token.startsWith(`${componentName}-`)) continue;
      // Valid if matches a dynamic prefix from SCSS @each (e.g. --ui-size-sm)
      const matchesDynamic = [...dynamicPrefixes].some((p) => token.startsWith(`${p}-`));
      if (matchesDynamic) continue;
      const line = content.substring(0, index).split('\n').length;
      errors.push(
        `${relPath}:${line}: --ui-${token} is not a known global token or ${componentName}-scoped token`,
      );
    }
  }

  if (errors.length > 0) {
    console.error('Token name validation failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(
      `\n${errors.length} unknown token reference(s). Use global tokens or --ui-{component}-* pattern.`,
    );
    process.exit(1);
  }

  console.log(`Token names: ${componentScssFiles.length} component SCSS files passed.`);
}

lintComponents();
lintSidenavCompleteness();
lintDocsContent();
lintTokenFallbacks();
lintBareTokenVars();
lintWrongLayerTokens();
lintStyleLayerTokens();
lintTokenNames();
lintApiSync();
