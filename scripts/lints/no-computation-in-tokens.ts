import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import postcssScss from 'postcss-scss';

import { findScssFiles } from './_utils.js';

interface Violation {
  file: string;
  line: number;
  prop: string;
  fn: string;
}

const BANNED_RE = /\b(calc|color-mix|min|max|clamp)\s*\(/;

function findComputationViolations(
  content: string,
  layerName: string,
  filterProps?: (prop: string) => boolean,
): { line: number; prop: string; fn: string }[] {
  const results: { line: number; prop: string; fn: string }[] = [];

  let root: ReturnType<typeof postcssScss.parse>;
  try {
    root = postcssScss.parse(content);
  } catch {
    return results;
  }

  root.walkAtRules('layer', (atRule) => {
    if (atRule.params !== layerName) return;

    atRule.walkDecls(/^--/, (decl) => {
      if (filterProps && !filterProps(decl.prop)) return;

      const match = decl.value.match(BANNED_RE);
      if (match) {
        results.push({
          line: decl.source?.start?.line ?? 0,
          prop: decl.prop,
          fn: match[1],
        });
      }
    });
  });

  return results;
}

export function lintNoComputationInTokens(srcDir: string): void {
  const violations: Violation[] = [];

  // Components: check @layer components.tokens
  const componentFiles = findScssFiles(join(srcDir, 'components'));
  for (const file of componentFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');

    for (const hit of findComputationViolations(content, 'components.tokens')) {
      violations.push({ file: relPath, ...hit });
    }
  }

  // Layout: check --_ and --ui- definitions in @layer primitives
  const layoutFiles = findScssFiles(join(srcDir, 'layout'));
  for (const file of layoutFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');

    const isTokenProp = (prop: string) => prop.startsWith('--_') || prop.startsWith('--ui-');
    for (const hit of findComputationViolations(content, 'primitives', isTokenProp)) {
      violations.push({ file: relPath, ...hit });
    }
  }

  if (violations.length > 0) {
    console.error('No-computation-in-tokens check failed:\n');

    const byFile = new Map<string, Violation[]>();
    for (const v of violations) {
      const list = byFile.get(v.file) ?? [];
      list.push(v);
      byFile.set(v.file, list);
    }

    for (const [file, hits] of byFile) {
      console.error(`  ${file}`);
      for (const h of hits) {
        console.error(
          `    :${h.line} ${h.prop} uses ${h.fn}() — move computation to config/tokens`,
        );
      }
    }

    console.error(
      `\n${violations.length} computation(s) in ${byFile.size} files. Token layers must only contain var() references.`,
    );
    process.exit(1);
  }

  console.log(
    `No-computation-in-tokens: ${componentFiles.length + layoutFiles.length} SCSS files passed.`,
  );
}
