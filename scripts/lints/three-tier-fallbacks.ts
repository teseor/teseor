import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcssScss from 'postcss-scss';
import { findScssFiles } from './_utils.js';

// Lint: every --_ definition in components.tokens / primitives must use 3-tier:
// var(--ui-component-token, var(--ui-global-token, #{t.$var}))
//
// Rules:
// 1. Any var(--ui-X, #{t.$Y}) where X != Y needs middle tier
// 2. Any --_ value with multiple #{t.$...} refs is a shorthand that should be split

const LAYER_NAMES = ['components.tokens', 'primitives'];

// Check if a value is a 2-tier pattern (missing middle var(--ui-...))
function findTwoTierViolations(value: string): Array<{ outerToken: string; scssVar: string }> {
  const results: Array<{ outerToken: string; scssVar: string }> = [];

  let pos = 0;
  while (pos < value.length) {
    const varStart = value.indexOf('var(--ui-', pos);
    if (varStart === -1) break;

    const nameStart = varStart + 'var(--ui-'.length;
    const commaPos = value.indexOf(',', nameStart);
    if (commaPos === -1) {
      pos = nameStart;
      continue;
    }

    const outerToken = value.substring(nameStart, commaPos).trim();
    const fallbackStart = commaPos + 1;
    const fallback = value.substring(fallbackStart).trimStart();

    if (fallback.startsWith('#{t.$')) {
      const dollarPos = fallback.indexOf('$');
      const endPos = fallback.indexOf('}', dollarPos);
      if (dollarPos !== -1 && endPos !== -1) {
        const scssVar = fallback.substring(dollarPos + 1, endPos);
        if (outerToken !== scssVar) {
          results.push({ outerToken, scssVar });
        }
      }
    }

    pos = nameStart;
  }

  return results;
}

// Count #{t.$...} occurrences in a value
function countScssRefs(value: string): number {
  let count = 0;
  let pos = 0;
  while (pos < value.length) {
    const idx = value.indexOf('#{t.$', pos);
    if (idx === -1) break;
    count++;
    pos = idx + 5;
  }
  return count;
}

export function lintThreeTierFallbacks(srcDir: string): void {
  const dirs = [join(srcDir, 'components'), join(srcDir, 'layout')];
  const scssFiles = dirs.flatMap(findScssFiles);
  const errors: string[] = [];
  const rootDir = join(srcDir, '../..');

  for (const file of scssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${rootDir}/`, '');

    let root: ReturnType<typeof postcssScss.parse>;
    try {
      root = postcssScss.parse(content);
    } catch {
      continue;
    }

    root.walkAtRules('layer', (atRule) => {
      if (!LAYER_NAMES.includes(atRule.params)) return;

      atRule.walkDecls(/^--_/, (decl) => {
        const line = decl.source?.start?.line ?? 0;

        // Rule 1: missing middle tier
        const violations = findTwoTierViolations(decl.value);
        for (const v of violations) {
          errors.push(
            `${relPath}:${line}: var(--ui-${v.outerToken}, #{t.$${v.scssVar}}) needs middle tier var(--ui-${v.scssVar}, ...)`,
          );
        }

        // Rule 2: multi-value shorthand — split into separate tokens
        if (countScssRefs(decl.value) > 1) {
          errors.push(
            `${relPath}:${line}: ${decl.prop} has multiple SCSS refs — split into separate -x/-y or individual tokens`,
          );
        }
      });
    });
  }

  if (errors.length > 0) {
    console.error('Three-tier fallback check failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(
      `\n${errors.length} violation(s). Every component token must use: var(--ui-component, var(--ui-global, #{t.$var}))`,
    );
    process.exit(1);
  }

  console.log(`Three-tier fallbacks: ${scssFiles.length} SCSS files passed.`);
}
