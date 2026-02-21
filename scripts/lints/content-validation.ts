// Validates .content.yml files against their api.json.
// Checks: Zod schema, modifier coverage, shared refs, component names.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { loadContent } from '../../packages/docgen/src/index.js';
import type { ApiJson } from '../../packages/docgen/src/types.js';

interface ContentFile {
  componentDir: string;
  contentPath: string;
  apiPath: string;
}

function findContentFiles(baseDir: string): ContentFile[] {
  const files: ContentFile[] = [];
  if (!existsSync(baseDir)) return files;

  for (const entry of readdirSync(baseDir)) {
    if (entry.startsWith('.')) continue;
    const p = join(baseDir, entry);
    if (!statSync(p).isDirectory()) continue;

    const contentPath = join(p, 'content.yml');
    if (existsSync(contentPath)) {
      files.push({
        componentDir: p,
        contentPath,
        apiPath: join(p, 'api.json'),
      });
    } else {
      files.push(...findContentFiles(p));
    }
  }
  return files;
}

function loadAllApis(srcDir: string): ApiJson[] {
  const apis: ApiJson[] = [];
  const dirs = ['components', 'layout'];
  for (const dir of dirs) {
    const base = join(srcDir, dir);
    if (!existsSync(base)) continue;
    loadApisRecursive(base, apis);
  }
  return apis;
}

function loadApisRecursive(dir: string, apis: ApiJson[]): void {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    const p = join(dir, entry);
    if (!statSync(p).isDirectory()) continue;
    const apiPath = join(p, 'api.json');
    if (existsSync(apiPath)) {
      apis.push(JSON.parse(readFileSync(apiPath, 'utf-8')));
    } else {
      loadApisRecursive(p, apis);
    }
  }
}

export function lintContentValidation(srcDir: string): void {
  const sharedPath = join(srcDir, 'content', 'shared.yml');
  if (!existsSync(sharedPath)) {
    console.log('Content validation: no shared.yml found, skipping.');
    return;
  }

  const sharedYaml = readFileSync(sharedPath, 'utf-8');
  const allApis = loadAllApis(srcDir);
  const contentFiles = [
    ...findContentFiles(join(srcDir, 'components')),
    ...findContentFiles(join(srcDir, 'layout')),
  ];

  if (contentFiles.length === 0) {
    console.log('Content validation: no .content.yml files found, skipping.');
    return;
  }

  let totalErrors = 0;
  const errorsByFile: Record<string, string[]> = {};

  for (const { contentPath, apiPath } of contentFiles) {
    const relPath = relative(join(srcDir, '..', '..'), contentPath);

    if (!existsSync(apiPath)) {
      errorsByFile[relPath] = ['missing api.json'];
      totalErrors++;
      continue;
    }

    const api: ApiJson = JSON.parse(readFileSync(apiPath, 'utf-8'));
    const yamlStr = readFileSync(contentPath, 'utf-8');

    try {
      const result = loadContent(yamlStr, api, sharedYaml, allApis);
      if (result.errors.length > 0) {
        errorsByFile[relPath] = result.errors.map((e) => `${e.path}: ${e.message}`);
        totalErrors += result.errors.length;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errorsByFile[relPath] = [`parse error: ${msg}`];
      totalErrors++;
    }
  }

  if (totalErrors > 0) {
    console.error(
      `Content validation: ${totalErrors} error(s) in ${Object.keys(errorsByFile).length} file(s):`,
    );
    for (const [file, errors] of Object.entries(errorsByFile)) {
      console.error(`  ${file}:`);
      for (const error of errors) {
        console.error(`    - ${error}`);
      }
    }
    process.exit(1);
  }

  console.log(`Content validation: ${contentFiles.length} .content.yml files passed.`);
}
