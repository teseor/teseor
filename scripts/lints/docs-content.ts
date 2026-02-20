import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { findComponentDirs } from '../shared/find-components.js';

interface ApiJson {
  name?: string;
  [key: string]: unknown;
}

export function lintDocsContent(componentsDir: string): void {
  const components = findComponentDirs(componentsDir);
  const errors: string[] = [];

  for (const { name, path } of components) {
    const apiFiles = readdirSync(path).filter((f) => f === 'api.json');
    for (const apiFile of apiFiles) {
      const raw = readFileSync(join(path, apiFile), 'utf-8');

      if (raw.includes('#{')) {
        errors.push(
          `${name}/${apiFile}: contains SCSS interpolation "#{" — values must be resolved`,
        );
      }

      let data: ApiJson;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        errors.push(`${name}/${apiFile}: invalid JSON — ${e instanceof Error ? e.message : e}`);
        continue;
      }
      if (!data.name) {
        errors.push(`${name}/${apiFile}: missing required "name" field`);
      }
      if (data.name && !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(data.name)) {
        errors.push(`${name}/${apiFile}: "name" must be kebab-case`);
      }
    }

    const docsHtmlFiles = readdirSync(path).filter((f) => f === 'docs.html');
    for (const docsFile of docsHtmlFiles) {
      const raw = readFileSync(join(path, docsFile), 'utf-8');
      const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) {
        errors.push(`${name}/${docsFile}: missing YAML frontmatter (--- delimiters)`);
        continue;
      }
      const fm = fmMatch[1];
      if (!/^title:\s*.+/m.test(fm)) {
        errors.push(`${name}/${docsFile}: missing required "title" in frontmatter`);
      }
      const apiMatch = fm.match(/^api:\s*(.+)/m);
      if (apiMatch) {
        const apiRef = apiMatch[1].trim();
        if (!existsSync(join(path, apiRef))) {
          errors.push(`${name}/${docsFile}: api path "${apiRef}" does not exist`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error('Docs content validation failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(`\n${errors.length} validation error(s).`);
    process.exit(1);
  }

  console.log(`Docs validation: ${components.length} components passed.`);
}
