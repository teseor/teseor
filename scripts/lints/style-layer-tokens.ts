import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcssScss from 'postcss-scss';
import { findScssFiles } from './_utils.js';

const STYLE_LAYERS = new Set(['components.styles']);
const TOKEN_REF_RE = /var\(--ui-[\w-]+/g;

export function lintStyleLayerTokens(srcDir: string): void {
  const errors: string[] = [];

  const dirs = [join(srcDir, 'components'), join(srcDir, 'layout')];
  const scssFiles = dirs.flatMap((d) => findScssFiles(d));

  for (const file of scssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');

    // Derive component name from path (last directory before index.scss)
    const parts = relPath.split('/');
    const componentName = parts[parts.length - 2];

    let root: ReturnType<typeof postcssScss.parse>;
    try {
      root = postcssScss.parse(content);
    } catch {
      continue;
    }

    // Collect @property declarations (these are legitimate direct refs)
    const propertyDecls = new Set<string>();
    root.walkAtRules('property', (atRule) => {
      const match = atRule.params.match(/^(--[\w-]+)/);
      if (match) propertyDecls.add(match[1]);
    });

    root.walkAtRules('layer', (atRule) => {
      if (!STYLE_LAYERS.has(atRule.params)) return;

      atRule.walkDecls((decl) => {
        // Skip custom property definitions — they're token defs, not style usage
        if (decl.prop.startsWith('--')) return;

        const line = decl.source?.start?.line ?? 0;
        for (const match of decl.value.matchAll(TOKEN_REF_RE)) {
          const tokenName = match[0].replace('var(', '');
          if (propertyDecls.has(tokenName)) continue;
          // Skip cross-component refs (e.g. --ui-topbar-height used in sidebar)
          const tokenSuffix = tokenName.replace('--ui-', '');
          if (!tokenSuffix.startsWith(`${componentName}-`)) continue;
          errors.push(
            `${relPath}:${line}: ${tokenName} used directly in styles layer — extract to --_ internal variable in tokens layer`,
          );
        }
      });
    });
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
