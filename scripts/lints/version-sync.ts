import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

interface VersionCheck {
  name: string;
  expected: string;
  files: { path: string; pattern: RegExp }[];
}

function extractPlaywrightMinor(version: string): string {
  // "^1.58.2" → "1.58", "1.58.2" → "1.58"
  const clean = version.replace(/^[\^~]/, '');
  const parts = clean.split('.');
  return `${parts[0]}.${parts[1]}`;
}

function extractMajor(version: string): string {
  // ">=22.0.0" → "22", "22" → "22"
  return version.replace(/^[>=^~]+/, '').split('.')[0];
}

function extractPnpmVersion(packageManager: string): string {
  // "pnpm@9.15.0" → "9.15.0"
  return packageManager.replace(/^pnpm@/, '');
}

export function lintVersionSync(): void {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  const errors: string[] = [];

  const playwrightMinor = extractPlaywrightMinor(pkg.devDependencies['@playwright/test']);
  const nodeMajor = extractMajor(pkg.engines.node);
  const pnpmVersion = extractPnpmVersion(pkg.packageManager);

  const checks: VersionCheck[] = [
    {
      name: 'Playwright container image',
      expected: playwrightMinor,
      files: [
        {
          path: '.github/workflows/visual-tests.yml',
          pattern: /playwright:v([\d.]+)-/,
        },
        {
          path: '.github/workflows/update-snapshots.yml',
          pattern: /playwright:v([\d.]+)-/,
        },
        {
          path: 'docker-compose.visual.yml',
          pattern: /playwright:v([\d.]+)-/,
        },
      ],
    },
    {
      name: 'Node version',
      expected: nodeMajor,
      files: [
        {
          path: '.github/workflows/visual-tests.yml',
          pattern: /node-version:\s*(\d+)/,
        },
        {
          path: '.github/workflows/update-snapshots.yml',
          pattern: /node-version:\s*(\d+)/,
        },
      ],
    },
    {
      name: 'pnpm version',
      expected: pnpmVersion,
      files: [
        {
          path: 'docker-compose.visual.yml',
          pattern: /pnpm@([\d.]+)/,
        },
      ],
    },
  ];

  for (const check of checks) {
    for (const file of check.files) {
      const filePath = join(ROOT, file.path);
      let content: string;
      try {
        content = readFileSync(filePath, 'utf-8');
      } catch {
        errors.push(`${file.path}: file not found`);
        continue;
      }

      const match = content.match(file.pattern);
      if (!match) {
        errors.push(`${file.path}: could not find ${check.name} pattern`);
        continue;
      }

      const found = match[1];
      const expected = check.expected;

      // For playwright, compare major.minor only
      const foundComparable =
        check.name === 'Playwright container image'
          ? found.split('.').slice(0, 2).join('.')
          : found;

      if (foundComparable !== expected) {
        errors.push(`${file.path}: ${check.name} is ${found} but package.json expects ${expected}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('Version sync check failed:\n');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(
      `\n${errors.length} version mismatch(es). Update the files to match package.json.`,
    );
    process.exit(1);
  }

  console.log('Version sync: all container/CI versions match package.json.');
}
