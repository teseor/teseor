#!/usr/bin/env node
/**
 * Generate API from SCSS
 *
 * Parses SCSS files with annotations and generates API.json files.
 *
 * Annotations:
 * - // @component {name} - Component name
 * - // @element {tag} - Default HTML element
 * - // @modifier {group} - Groups following .component--{value} classes
 * - // @modifier boolean {name} - Boolean modifier
 * - // @var {name} {description} - CSS custom property
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const COMPONENTS_DIR = join(ROOT, 'packages/css/src/04-components');

/**
 * Extract CSS custom properties from SCSS
 * Pattern: var(--ui-{component}-{prop}, {default})
 */
function extractCssVars(content, componentName) {
  const vars = [];
  const seen = new Set();

  // Match var(--ui-component-*, fallback)
  const varPattern = new RegExp(`var\\(--ui-${componentName}-([^,)]+),\\s*([^)]+)\\)`, 'g');

  for (const match of content.matchAll(varPattern)) {
    const varName = `--ui-${componentName}-${match[1]}`;
    if (seen.has(varName)) continue;
    seen.add(varName);

    // Extract the fallback value (simplified - just first fallback)
    let defaultValue = match[2].trim();
    // If it's a var(), extract that
    const innerVar = defaultValue.match(/var\(([^,)]+)/);
    if (innerVar) {
      defaultValue = `var(${innerVar[1]})`;
    }

    vars.push({
      name: varName,
      default: defaultValue,
    });
  }

  return vars;
}

/**
 * Extract modifier classes from SCSS
 * Pattern: .component--{value}
 */
function extractModifiers(content, componentName) {
  const modifiers = {};
  const lines = content.split('\n');

  let currentGroup = null;
  let isBooleanGroup = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for @modifier annotation
    const modifierAnnotation = line.match(/\/\/\s*@modifier\s+(boolean\s+)?(\w+)/);
    if (modifierAnnotation) {
      isBooleanGroup = !!modifierAnnotation[1];
      currentGroup = modifierAnnotation[2];

      if (isBooleanGroup) {
        // Boolean modifier - the name IS the modifier
        modifiers[currentGroup] = { type: 'boolean' };
        currentGroup = null; // Reset so next classes don't get added
      } else {
        if (!modifiers[currentGroup]) {
          modifiers[currentGroup] = { values: [] };
        }
      }
      continue;
    }

    // Check for class definition - both .component--value and &--value syntax
    const classMatch = line.match(new RegExp(`\\.${componentName}--([\\w-]+)\\s*\\{`));
    const nestedMatch = line.match(/&--([\\w-]+)\s*[{,]/);

    const value = classMatch ? classMatch[1] : nestedMatch ? nestedMatch[1] : null;

    if (value && currentGroup) {
      // Skip pseudo-class mirrors like --hover, --focus, --active
      if (['hover', 'focus', 'active'].includes(value)) {
        continue;
      }

      if (modifiers[currentGroup].values) {
        if (!modifiers[currentGroup].values.includes(value)) {
          modifiers[currentGroup].values.push(value);
        }
      }
    }
  }

  // Clean up empty groups
  for (const [key, mod] of Object.entries(modifiers)) {
    if (mod.values && mod.values.length === 0) {
      delete modifiers[key];
    }
  }

  return modifiers;
}

/**
 * Parse SCSS file and generate API object
 */
function parseScss(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const dir = dirname(filePath);
  const componentName = basename(dir);

  // Extract @component annotation or use folder name
  const componentMatch = content.match(/\/\/\s*@component\s+(\w+)/);
  const name = componentMatch ? componentMatch[1] : componentName;

  // Extract @element annotation or default to 'div'
  const elementMatch = content.match(/\/\/\s*@element\s+(\w+)/);
  const element = elementMatch ? elementMatch[1] : 'div';

  // Extract modifiers
  const modifiers = extractModifiers(content, name);

  // Extract CSS vars
  const cssVars = extractCssVars(content, name);

  return {
    name,
    element,
    modifiers,
    cssVars,
  };
}

/**
 * Find all component SCSS files
 */
function findComponentFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && !entry.startsWith('.')) {
      const indexPath = join(fullPath, 'index.scss');
      try {
        statSync(indexPath);
        files.push(indexPath);
      } catch {
        // No index.scss in this directory
      }
    }
  }

  return files;
}

/**
 * Generate API file for a component
 */
function generateApiFile(scssPath) {
  const api = parseScss(scssPath);
  const dir = dirname(scssPath);
  const apiPath = join(dir, `${api.name}.api.json`);

  writeFileSync(apiPath, `${JSON.stringify(api, null, 2)}\n`);
  console.log(`Generated: ${apiPath}`);

  return api;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Generate for all components
    console.log('Generating API files for all components...\n');
    const files = findComponentFiles(COMPONENTS_DIR);

    for (const file of files) {
      try {
        generateApiFile(file);
      } catch (err) {
        console.error(`Error processing ${file}: ${err.message}`);
      }
    }

    console.log(`\nGenerated ${files.length} API files.`);
  } else {
    // Generate for specific component
    const componentName = args[0];
    const scssPath = join(COMPONENTS_DIR, componentName, 'index.scss');

    try {
      generateApiFile(scssPath);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  }
}

main();
