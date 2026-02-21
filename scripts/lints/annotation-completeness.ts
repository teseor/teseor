import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { type Diagnostic, lintScss, parseScss } from '@teseor/docgen';

import { findComponentDirs } from '../shared/find-components.js';

export function lintAnnotationCompleteness(componentsDir: string): void {
  const components = findComponentDirs(componentsDir);
  const errors: string[] = [];

  for (const comp of components) {
    const scssPath = join(comp.path, 'index.scss');
    const content = readFileSync(scssPath, 'utf-8');
    const root = parseScss(content);
    const diags: Diagnostic[] = lintScss(root);

    const relPath = relative(join(componentsDir, '..'), scssPath);
    for (const d of diags) {
      errors.push(`${relPath}:${d.line}: ${d.message}`);
    }
  }

  if (errors.length > 0) {
    console.error('Annotation completeness check failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(
      `\n${errors.length} annotation issue(s) found. Add missing @component, @element, @desc, or @modifier annotations.`,
    );
    process.exit(1);
  }

  console.log(`Annotation completeness: ${components.length} components passed.`);
}
