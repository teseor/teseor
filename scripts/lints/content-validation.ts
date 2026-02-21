// Validates content.yml files against their api.json.
// Checks: Zod schema, modifier coverage, shared refs, component names.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  type ApiJson,
  buildComponentNameSet,
  loadContentFromParsed,
  parseSharedYaml,
} from '@teseor/docgen';

interface ZodIssue {
  path: (string | number)[];
  message: string;
}

function walkForFile<T>(
  baseDir: string,
  fileName: string,
  mapFn: (dir: string, filePath: string) => T,
): T[] {
  const results: T[] = [];
  if (!existsSync(baseDir)) return results;

  for (const entry of readdirSync(baseDir)) {
    if (entry.startsWith('.')) continue;
    const dir = join(baseDir, entry);
    if (!statSync(dir).isDirectory()) continue;

    const filePath = join(dir, fileName);
    if (existsSync(filePath)) {
      results.push(mapFn(dir, filePath));
    } else {
      results.push(...walkForFile(dir, fileName, mapFn));
    }
  }
  return results;
}

function isZodError(err: unknown): err is { issues: ZodIssue[] } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'issues' in err &&
    Array.isArray((err as Record<string, unknown>).issues)
  );
}

function formatZodIssues(issues: ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });
}

export function lintContentValidation(srcDir: string): void {
  const sharedPath = join(srcDir, 'content', 'shared.yml');
  if (!existsSync(sharedPath)) {
    console.log('Content validation: no shared.yml found, skipping.');
    return;
  }

  const shared = parseSharedYaml(readFileSync(sharedPath, 'utf-8'));

  const searchDirs = ['components', 'layout'];
  const allApis = searchDirs.flatMap((dir) =>
    walkForFile(
      join(srcDir, dir),
      'api.json',
      (_dir, filePath) => JSON.parse(readFileSync(filePath, 'utf-8')) as ApiJson,
    ),
  );

  const knownComponents = buildComponentNameSet(allApis);

  const contentFiles = searchDirs.flatMap((dir) =>
    walkForFile(join(srcDir, dir), 'content.yml', (componentDir, contentPath) => ({
      componentDir,
      contentPath,
      apiPath: join(componentDir, 'api.json'),
    })),
  );

  if (contentFiles.length === 0) {
    console.log('Content validation: no content.yml files found, skipping.');
    return;
  }

  let totalErrors = 0;
  const errorsByFile: Record<string, string[]> = {};
  const rootDir = join(srcDir, '..', '..');

  for (const { contentPath, apiPath } of contentFiles) {
    const relPath = relative(rootDir, contentPath);

    if (!existsSync(apiPath)) {
      errorsByFile[relPath] = ['missing api.json'];
      totalErrors++;
      continue;
    }

    const api: ApiJson = JSON.parse(readFileSync(apiPath, 'utf-8'));
    const yamlStr = readFileSync(contentPath, 'utf-8');

    try {
      const result = loadContentFromParsed(yamlStr, api, shared, knownComponents);
      if (result.errors.length > 0) {
        errorsByFile[relPath] = result.errors.map((e) => `${e.path}: ${e.message}`);
        totalErrors += result.errors.length;
      }
    } catch (err) {
      if (isZodError(err)) {
        const formatted = formatZodIssues(err.issues);
        errorsByFile[relPath] = formatted;
        totalErrors += formatted.length;
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        errorsByFile[relPath] = [`parse error: ${msg}`];
        totalErrors++;
      }
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

  console.log(`Content validation: ${contentFiles.length} content.yml files passed.`);
}
