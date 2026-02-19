import { readFileSync } from 'node:fs';

import { findDocsHtmlFiles } from './_utils.js';

export function lintI18nCoverage(srcDir: string): void {
  const files = findDocsHtmlFiles(srcDir);
  let totalBare = 0;
  const filesBare: { file: string; count: number }[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${srcDir}/`, '');

    const fmMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    if (!fmMatch) continue;
    const body = fmMatch[1];

    let bareCount = 0;
    let inPre = false;
    let inSvg = false;

    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (/<pre[\s>]/.test(line)) inPre = true;
      if (/<\/pre>/.test(line)) {
        inPre = false;
        continue;
      }
      if (inPre) continue;
      if (/<svg[\s>]/.test(line)) inSvg = true;
      if (/<\/svg>/.test(line)) {
        inSvg = false;
        continue;
      }
      if (inSvg) continue;

      if (/^\s*<!--/.test(trimmed)) continue;
      if (/\{\{|\{%/.test(line)) continue;
      if (/^(--|:root|@media|@layer|@property|\.ui-|var\(|\/\/|\/\*|\*|#|[{}])/.test(trimmed))
        continue;
      if (/[{};]$/.test(trimmed)) continue;
      if (/^(npm|pnpm|yarn|import|export|const|let|function)\s/.test(trimmed)) continue;

      const bareMatches = line.match(/>([^<{}\n]+)</g);
      if (bareMatches) {
        for (const m of bareMatches) {
          const text = m.slice(1, -1).trim();
          if (!text || /^[\d.,]+(%|px|rem|em|ms|s)?$/.test(text)) continue;
          if (text === '...' || text === '\u2026') continue;
          if (/^\.ui-|^--|^var\(/.test(text)) continue;
          if (!/[a-zA-Z]/.test(text)) continue;
          const idx = line.indexOf(m);
          const before = line.substring(0, idx);
          if (before.lastIndexOf('<code') > before.lastIndexOf('</code')) continue;
          bareCount++;
        }
      }

      if (!/[<>]/.test(trimmed) && /[a-zA-Z]/.test(trimmed)) {
        if (!/^[\w][\w-]*:\s/.test(trimmed)) {
          bareCount++;
        }
      }
    }

    if (bareCount > 0) {
      filesBare.push({ file: relPath, count: bareCount });
      totalBare += bareCount;
    }
  }

  if (totalBare > 0) {
    console.warn(`i18n coverage: ${totalBare} unwrapped text(s) in ${filesBare.length} file(s):`);
    for (const { file, count } of filesBare) {
      console.warn(`  ${file} (${count})`);
    }
    console.warn("Wrap visible text with {{ t('key', 'text') }} for i18n readiness.\n");
  } else {
    console.log(`i18n coverage: ${files.length} docs files fully wrapped.`);
  }
}
