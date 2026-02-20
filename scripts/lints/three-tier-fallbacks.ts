import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findScssFiles } from './_utils.js';
import { findCategoryPrefix } from './token-dictionary.js';

// Matches a CSS custom property where the fallback is a bare SCSS token reference:
//   var(--ui-TOKEN, #{t.$SCSS_VAR})
// capturing TOKEN as group 1 and SCSS_VAR as group 2.
const BARE_SCSS_FALLBACK_PATTERN = /var\(--ui-([\w-]+),\s*#\{t\.\$([\w-]+)\}\s*\)/g;

// Lint: component tokens must use the 3-tier fallback pattern
// var(--ui-component-token, var(--ui-global-token, #{t.$var}))
//
// Flags: var(--ui-COMPONENT, #{t.$GLOBAL_VAR}) when $GLOBAL_VAR maps to a
// known global token and the outer token is component-specific (not itself global).

export function lintThreeTierFallbacks(srcDir: string): void {
  const componentsDir = join(srcDir, 'components');
  const scssFiles = findScssFiles(componentsDir);
  const errors: string[] = [];
  const rootDir = process.cwd();

  for (const file of scssFiles) {
    const content = readFileSync(file, 'utf-8');
    const relPath = file.replace(`${rootDir}/`, '');

    const layerMarker = '@layer components.tokens';
    let searchFrom = 0;

    while (searchFrom < content.length) {
      const layerStart = content.indexOf(layerMarker, searchFrom);
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

      // Match var(--ui-TOKEN, #{t.$SCSS_VAR}) — bare SCSS ref as fallback
      const pattern = BARE_SCSS_FALLBACK_PATTERN;

      for (const m of layerBody.matchAll(pattern)) {
        const outerToken = m[1];
        const scssVar = m[2];

        // Skip direct global aliases: outer token name == SCSS var name
        if (outerToken === scssVar) continue;

        // Skip if outer token IS a known global (variant overrides, row refs, etc.)
        if (findCategoryPrefix(outerToken)) continue;

        // Skip if SCSS var has no matching global token category
        if (!findCategoryPrefix(scssVar)) continue;

        const absIndex = layerBodyStart + (m.index ?? 0);
        const line = content.substring(0, absIndex).split('\n').length;
        errors.push(
          `${relPath}:${line}: var(--ui-${outerToken}) fallback #{t.$${scssVar}} needs middle tier var(--ui-${scssVar}, ...)`,
        );
      }

      searchFrom = pos;
    }
  }

  if (errors.length > 0) {
    console.error('Three-tier fallback check failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(
      `\n${errors.length} missing middle-tier fallback(s). Use: var(--ui-component, var(--ui-global, #{t.$var}))`,
    );
    process.exit(1);
  }

  console.log(`Three-tier fallbacks: ${scssFiles.length} SCSS files passed.`);
}
