import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS_ROOT = join(__dirname, '../../../packages/css/src');

// Find all component API files
function findApiFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...findApiFiles(path));
    } else if (entry.endsWith('.api.json')) {
      files.push(path);
    }
  }
  return files;
}

// Extract --{component}-* vars with defaults from SCSS
// Patterns:
//   var(--button-height, var(--row-2, ...)) -> --row-2
//   var(--button-ghost-bg, transparent) -> transparent
//   var(--button-height-sm, calc(var(--row, ...) * 1.5)) -> calc(--row * 1.5)
function extractScssVars(scssPath, componentName) {
  const content = readFileSync(scssPath, 'utf-8');
  const vars = new Map();

  // Match var(--component-prop, <default>)
  const pattern = new RegExp(`var\\(--${componentName}-([a-z0-9-]+),\\s*`, 'g');

  for (const match of content.matchAll(pattern)) {
    const varName = match[1];
    const afterComma = content.slice(match.index + match[0].length);

    let defaultVal;
    if (afterComma.startsWith('var(')) {
      // var(--token, ...) -> extract --token
      const tokenMatch = afterComma.match(/^var\((--[a-z0-9-]+)/);
      defaultVal = tokenMatch ? tokenMatch[1] : null;
    } else if (afterComma.startsWith('calc(')) {
      // calc(...) -> extract simplified form
      const calcMatch = afterComma.match(/^calc\(var\((--[a-z0-9-]+)[^)]*\)\s*\*\s*([\d.]+)\)/);
      defaultVal = calcMatch ? `calc(${calcMatch[1]} * ${calcMatch[2]})` : 'calc(...)';
    } else {
      // literal value like "transparent"
      const literalMatch = afterComma.match(/^([a-z0-9-]+)/);
      defaultVal = literalMatch ? literalMatch[1] : null;
    }

    if (defaultVal) {
      vars.set(varName, defaultVal);
    }
  }

  return vars;
}

// Extract all var names with defaults from grouped API structure
function extractApiVars(vars, componentName) {
  const result = new Map();

  for (const [group, content] of Object.entries(vars)) {
    if (group === 'base') {
      for (const [prop, defaultVal] of Object.entries(content)) {
        result.set(prop, defaultVal);
      }
    } else {
      // Modifier vars: variant-prop or prop-modifier naming
      for (const [modifier, props] of Object.entries(content)) {
        for (const [prop, defaultVal] of Object.entries(props)) {
          // Store both naming patterns pointing to same default
          const variantFirst = `${modifier}-${prop}`; // --button-secondary-bg
          const propFirst = `${prop}-${modifier}`; // --button-height-sm
          result.set(variantFirst, defaultVal);
          result.set(propFirst, defaultVal);
        }
      }
    }
  }

  return result;
}

// Main validation
function validate() {
  const apiFiles = findApiFiles(join(CSS_ROOT, '04-components'));
  let hasErrors = false;

  console.log('Validating component vars against API...\n');

  for (const apiPath of apiFiles) {
    const api = JSON.parse(readFileSync(apiPath, 'utf-8'));
    const componentDir = dirname(apiPath);
    const scssPath = join(componentDir, 'index.scss');

    if (!api.vars) {
      console.log(`[SKIP] ${api.name} - no vars defined`);
      continue;
    }

    const apiVars = extractApiVars(api.vars, api.name);
    const scssVars = extractScssVars(scssPath, api.name);

    const issues = [];

    // Check for vars in SCSS not in API
    for (const [varName] of scssVars) {
      if (!apiVars.has(varName)) {
        issues.push(`  undocumented: --${api.name}-${varName}`);
      }
    }

    // Check for default value mismatches
    for (const [varName, scssDefault] of scssVars) {
      const apiDefault = apiVars.get(varName);
      if (apiDefault && apiDefault !== scssDefault) {
        issues.push(
          `  mismatch: --${api.name}-${varName} (CSS: ${scssDefault}, API: ${apiDefault})`,
        );
      }
    }

    if (issues.length === 0) {
      console.log(`[OK] ${api.name}`);
    } else {
      hasErrors = true;
      console.log(`[WARN] ${api.name}`);
      for (const i of issues) console.log(i);
    }
  }

  console.log('\nDone.');
  process.exit(hasErrors ? 1 : 0);
}

validate();
