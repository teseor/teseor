import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  extractAllTokenRefs,
  extractDynamicTokenPrefixes,
  extractPropertyDeclarations,
  extractTokenDefinitions,
} from '../shared/lint-helpers.js';

import { findScssFiles } from './_utils.js';

export function lintTokenNames(srcDir: string): void {
  const tokensDir = join(srcDir, 'config/tokens');
  const errors: string[] = [];

  const globalTokens = new Set<string>();
  for (const file of findScssFiles(tokensDir)) {
    const content = readFileSync(file, 'utf-8');
    for (const token of extractTokenDefinitions(content)) {
      globalTokens.add(token);
    }
  }

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

  const componentScssFiles = findScssFiles(join(srcDir, 'components'));
  for (const file of componentScssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');

    const parts = relPath.split('/');
    const componentName = parts[parts.length - 2];

    const propertyDecls = extractPropertyDeclarations(content);

    const refs = extractAllTokenRefs(content);
    for (const { token, index } of refs) {
      const fullName = `--ui-${token}`;
      if (propertyDecls.has(fullName)) continue;
      if (token.endsWith('-')) continue;
      if (globalTokens.has(token)) continue;
      if (token.startsWith(`${componentName}-`)) continue;
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
