import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { extractPropertyDeclarations } from '../shared/lint-helpers.js';

import { findScssFiles } from './_utils.js';

export function lintStyleLayerTokens(srcDir: string): void {
  const errors: string[] = [];

  const dirs = [join(srcDir, 'components'), join(srcDir, 'layout')];
  const scssFiles = dirs.flatMap((d) => findScssFiles(d));

  const stylesLayerPatterns = ['@layer components.styles', '@layer primitives'];

  for (const file of scssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');

    const propertyDecls = extractPropertyDeclarations(content);

    for (const layerName of stylesLayerPatterns) {
      let searchFrom = 0;
      while (searchFrom < content.length) {
        const layerStart = content.indexOf(layerName, searchFrom);
        if (layerStart === -1) break;

        const braceStart = content.indexOf('{', layerStart);
        if (braceStart === -1) break;

        let depth = 1;
        let pos = braceStart + 1;
        while (pos < content.length && depth > 0) {
          if (content[pos] === '{') depth++;
          else if (content[pos] === '}') depth--;
          pos++;
        }
        const layerBody = content.substring(braceStart + 1, pos - 1);
        const layerBodyStart = braceStart + 1;

        const lines = layerBody.split('\n');
        let charOffset = 0;
        for (const rawLine of lines) {
          const isCustomPropDecl = /^\s*--[\w_-]+\s*:/.test(rawLine);
          if (!isCustomPropDecl) {
            const tokenPattern = /var\(--ui-[\w-]+/g;
            for (
              let match = tokenPattern.exec(rawLine);
              match !== null;
              match = tokenPattern.exec(rawLine)
            ) {
              const tokenName = match[0].replace('var(', '');
              if (propertyDecls.has(tokenName)) continue;
              const absoluteIdx = layerBodyStart + charOffset + match.index;
              const line = content.substring(0, absoluteIdx).split('\n').length;
              errors.push(
                `${relPath}:${line}: ${tokenName} used directly in styles layer — extract to --_ internal variable in tokens layer`,
              );
            }
          }
          charOffset += rawLine.length + 1;
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
