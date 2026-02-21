import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ChildNode, Container, Rule } from 'postcss';
import postcssScss from 'postcss-scss';
import { findScssFiles } from './_utils.js';

// Lint: every --_ declaration in token layers should use @include t.token()
// in base class selectors. Modifier selectors (.foo--bar) are allowed to use
// hand-written 3-tier overrides.

const LAYER_NAMES = ['components.tokens', 'primitives'];

type Violation = {
  file: string;
  line: number;
  prop: string;
  value: string;
  category: string;
  selector: string;
  isModifier: boolean;
};

function isModifierContext(node: ChildNode): boolean {
  let current: Container | undefined = node.parent;
  while (current) {
    if (current.type === 'rule') {
      const selector = (current as Rule).selector;
      if (selector.includes('--')) return true;
    }
    current = 'parent' in current ? (current.parent as Container | undefined) : undefined;
  }
  return false;
}

function getParentSelector(node: ChildNode): string {
  const parts: string[] = [];
  let current: Container | undefined = node.parent;
  while (current) {
    if (current.type === 'rule') {
      parts.unshift((current as Rule).selector);
    }
    current = 'parent' in current ? (current.parent as Container | undefined) : undefined;
  }
  return parts.join(' > ');
}

function categorize(value: string): string {
  const trimmed = value.trim();

  // Pure CSS keywords with no var()
  if (
    /^(transparent|none|auto|inherit|currentColor|0|normal|cover|contain|underline)$/.test(trimmed)
  ) {
    return 'keyword-reset';
  }

  // Percentage or pure number
  if (/^\d+(%|px|rem|em)?$/.test(trimmed) || /^\d+\.\d+$/.test(trimmed)) {
    return 'hardcoded-value';
  }

  // SCSS variable only: #{t.$foo}
  if (/^#\{t\.\$[\w-]+\}$/.test(trimmed)) {
    return 'bare-scss-ref';
  }

  // Negated SCSS: #{-(t.$foo)}
  if (trimmed.includes('-(t.$')) {
    return 'negated-scss';
  }

  // Compound value (border shorthand, etc)
  if (trimmed.includes('solid') || trimmed.includes('dashed')) {
    return 'compound-value';
  }

  // Layout primitives pattern: var(--_internal-ref) or var(--box-*)
  if (/^var\(--_/.test(trimmed) || /^var\(--box-/.test(trimmed)) {
    return 'internal-ref';
  }

  // 1-tier: var(--ui-X) with NO fallback at all
  if (/^var\(--ui-[\w-]+\)$/.test(trimmed)) {
    return 'one-tier';
  }

  // 2-tier: var(--ui-X, fallback) — no middle var(--ui-...)
  if (trimmed.startsWith('var(--ui-') && !trimmed.includes('var(--ui-', 4)) {
    return 'two-tier';
  }

  // Valid 3-tier with #{t.$...} or #{t.fn(...)} — should use @include t.token()
  if (trimmed.startsWith('var(--ui-') && /#\{t\./.test(trimmed)) {
    return 'migrateable';
  }

  // SCSS function call without var() wrapper: #{t.size(...)}
  if (/t\.\w+\(/.test(trimmed) && !trimmed.includes('t.$')) {
    return 'scss-function';
  }

  // 2-tier: var(--ui-X, var(--ui-Y)) — no SCSS fallback
  if (trimmed.startsWith('var(--ui-') && !trimmed.includes('#{t.$') && !trimmed.includes('#{t.')) {
    return 'two-tier-no-scss';
  }

  return 'other';
}

export function lintRequireTokenMixin(srcDir: string): void {
  const dirs = [join(srcDir, 'components'), join(srcDir, 'layout')];
  const scssFiles = dirs.flatMap(findScssFiles);
  const violations: Violation[] = [];
  const rootDir = join(srcDir, '../..');

  for (const file of scssFiles) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
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

        // Skip if current or previous line has // token-lint-ignore
        const currentLine = lines[line - 1] ?? '';
        const prevLine = lines[line - 2] ?? '';
        if (currentLine.includes('token-lint-ignore') || prevLine.includes('token-lint-ignore')) {
          return;
        }

        const selector = getParentSelector(decl);
        const category = categorize(decl.value);

        violations.push({
          file: relPath,
          line,
          prop: decl.prop,
          value: decl.value.length > 80 ? `${decl.value.substring(0, 77)}...` : decl.value,
          category,
          selector,
          isModifier: isModifierContext(decl),
        });
      });
    });
  }

  if (violations.length === 0) {
    console.log(`Require token mixin: ${scssFiles.length} SCSS files passed.`);
    return;
  }

  // Split: base class vs modifier
  const baseViolations = violations.filter((v) => !v.isModifier);
  const modViolations = violations.filter((v) => v.isModifier);

  // Group by category
  const printGroup = (label: string, items: Violation[]) => {
    if (items.length === 0) return;
    const byCategory = new Map<string, Violation[]>();
    for (const v of items) {
      const list = byCategory.get(v.category) || [];
      list.push(v);
      byCategory.set(v.category, list);
    }

    console.error(`\n=== ${label} (${items.length}) ===\n`);
    for (const [category, catItems] of [...byCategory.entries()].sort(
      (a, b) => b[1].length - a[1].length,
    )) {
      console.error(`  [${category}] (${catItems.length}):`);
      for (const v of catItems) {
        console.error(`    ${v.file}:${v.line}  ${v.prop}: ${v.value}`);
      }
    }
  };

  console.error('Raw --_ declarations found (should use @include t.token()):\n');

  printGroup('BASE CLASS', baseViolations);
  printGroup('MODIFIER OVERRIDES', modViolations);

  const files = new Set(violations.map((v) => v.file)).size;
  console.error(
    `\nTotal: ${violations.length} raw --_ (${baseViolations.length} base + ${modViolations.length} modifier) across ${files} files.`,
  );

  // Fail on all violations
  process.exit(1);
}
