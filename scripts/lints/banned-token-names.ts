import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { findScssFiles } from './_utils.js';

export function lintBannedTokenNames(srcDir: string, appsDir: string): void {
  const errors: string[] = [];
  const rootDir = join(srcDir, '../..');

  const bannedPatterns: { pattern: RegExp; message: string }[] = [
    {
      pattern: /--ui-weight-(?:normal|medium|semibold|bold)/g,
      message: 'use --ui-font-weight-* instead of --ui-weight-*',
    },
    {
      pattern: /\$weight-(?:normal|medium|semibold|bold)/g,
      message: 'use $font-weight-* instead of $weight-*',
    },
    {
      pattern: /--ui-leading-(?:tight-)?(?:xs|sm|md|lg|xl|2xl|3xl|4xl)/g,
      message: 'use --ui-line-height-* instead of --ui-leading-*',
    },
    {
      pattern: /\$leading-(?:tight-)?(?:xs|sm|md|lg|xl|2xl|3xl|4xl)/g,
      message: 'use $line-height-* instead of $leading-*',
    },
    {
      pattern: /--ui-tracking-(?:display|body|caps|wide)/g,
      message: 'use --ui-letter-spacing-* instead of --ui-tracking-*',
    },
    {
      pattern: /\$tracking-(?:display|body|caps|wide)/g,
      message: 'use $letter-spacing-* instead of $tracking-*',
    },
    {
      pattern:
        /--ui-z-(?!index-)(?:base|sticky|dropdown|overlay|modal|popover|tooltip|toast|drawer|debug)/g,
      message: 'use --ui-z-index-* instead of --ui-z-*',
    },
    {
      pattern:
        /\$z-(?!index-)(?:base|sticky|dropdown|overlay|modal|popover|tooltip|toast|drawer|debug)/g,
      message: 'use $z-index-* instead of $z-*',
    },
  ];

  const allFiles = [...findScssFiles(srcDir), ...findScssFiles(appsDir)];

  for (const file of allFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${rootDir}/`, '');

    for (const { pattern, message } of bannedPatterns) {
      pattern.lastIndex = 0;
      for (let match = pattern.exec(content); match !== null; match = pattern.exec(content)) {
        const line = content.substring(0, match.index).split('\n').length;
        errors.push(`${relPath}:${line}: "${match[0]}" is banned — ${message}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('Banned token names check failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(
      `\n${errors.length} banned token name(s) found. See naming dictionary for allowed names.`,
    );
    process.exit(1);
  }

  console.log(`Banned token names: ${allFiles.length} SCSS files passed.`);
}
