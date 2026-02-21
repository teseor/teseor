import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcssScss from 'postcss-scss';
import { findScssFiles } from './_utils.js';

const TOKEN_REF_RE = /var\(--ui-([\w-]+)/g;
const TOKEN_DEF_RE = /^--ui-/;
const DYNAMIC_RE = /var\(--ui-([\w-]+)-#\{/g;

export function lintTokenNames(srcDir: string): void {
  const errors: string[] = [];

  // Collect all global token definitions
  const globalTokens = new Set<string>();
  const allScssFiles = findScssFiles(srcDir);
  for (const file of allScssFiles) {
    const content = readFileSync(file, 'utf-8');
    let root: ReturnType<typeof postcssScss.parse>;
    try {
      root = postcssScss.parse(content);
    } catch {
      continue;
    }
    root.walkDecls(TOKEN_DEF_RE, (decl) => {
      globalTokens.add(decl.prop.replace('--ui-', ''));
    });
  }

  // Collect dynamic token prefixes (from @each loops)
  const dynamicPrefixes = new Set<string>();
  for (const file of allScssFiles) {
    const content = readFileSync(file, 'utf-8');
    for (const match of content.matchAll(DYNAMIC_RE)) {
      dynamicPrefixes.add(match[1]);
    }
  }

  // Collect @property declarations
  const componentScssFiles = findScssFiles(join(srcDir, 'components'));
  for (const file of componentScssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');

    const parts = relPath.split('/');
    const componentName = parts[parts.length - 2];

    let root: ReturnType<typeof postcssScss.parse>;
    try {
      root = postcssScss.parse(content);
    } catch {
      continue;
    }

    const propertyDecls = new Set<string>();
    root.walkAtRules('property', (atRule) => {
      const match = atRule.params.match(/^(--[\w-]+)/);
      if (match) propertyDecls.add(match[1]);
    });

    root.walkDecls((decl) => {
      const line = decl.source?.start?.line ?? 0;
      // Check in value
      for (const match of decl.value.matchAll(TOKEN_REF_RE)) {
        const token = match[1];
        const fullName = `--ui-${token}`;
        if (propertyDecls.has(fullName)) continue;
        if (token.endsWith('-')) continue;
        if (globalTokens.has(token)) continue;
        if (token.startsWith(`${componentName}-`)) continue;
        const matchesDynamic = [...dynamicPrefixes].some((p) => token.startsWith(`${p}-`));
        if (matchesDynamic) continue;
        errors.push(
          `${relPath}:${line}: --ui-${token} is not a known global token or ${componentName}-scoped token`,
        );
      }
    });

    // Also check @include t.token() params for global token refs
    root.walkAtRules('include', (atRule) => {
      const line = atRule.source?.start?.line ?? 0;
      for (const match of atRule.params.matchAll(TOKEN_REF_RE)) {
        const token = match[1];
        const fullName = `--ui-${token}`;
        if (propertyDecls.has(fullName)) continue;
        if (token.endsWith('-')) continue;
        if (globalTokens.has(token)) continue;
        if (token.startsWith(`${componentName}-`)) continue;
        errors.push(
          `${relPath}:${line}: --ui-${token} is not a known global token or ${componentName}-scoped token`,
        );
      }
    });
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
