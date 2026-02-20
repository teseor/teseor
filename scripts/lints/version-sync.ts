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
  if (parts.length < 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid Playwright version string: "${version}". Expected at least major.minor.`);
  }
  return `${parts[0]}.${parts[1]}`;
}

function extractMajor(version: string): string {
  // ">=22.0.0" → "22", "22" → "22"
  const clean = version.replace(/^[>=^~]+/, '');
  if (!clean || !/^\d/.test(clean)) {
    throw new Error(`Invalid Node engine version: "${version}"`);
  }
  return clean.split('.')[0];
}

function extractPnpmVersion(packageManager: string): string {
  // "pnpm@9.15.0" → "9.15.0"
  if (!packageManager.startsWith('pnpm@')) {
    throw new Error(
      `Expected packageManager to start with "pnpm@", but got "${packageManager}". ` +
        'This lint currently supports only pnpm as the package manager.',
    );
  }
  return packageManager.replace(/^pnpm@/, '');
}

export function lintVersionSync(): void {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  const errors: string[] = [];

  const playwrightDep =
    pkg &&
    typeof pkg === 'object' &&
    pkg.devDependencies &&
    typeof pkg.devDependencies === 'object'
      ? pkg.devDependencies['@playwright/test']
      : undefined;
  if (typeof playwrightDep !== 'string') {
    throw new Error(
      "Missing required devDependency '@playwright/test' in package.json",
    );
  }

  const nodeEngine =
    pkg &&
    typeof pkg === 'object' &&
    pkg.engines &&
    typeof pkg.engines === 'object'
      ? pkg.engines.node
      : undefined;
  if (typeof nodeEngine !== 'string') {
    throw new Error(
      "Missing required 'engines.node' field in package.json",
    );
  }

  const packageManager =
    pkg && typeof pkg === 'object' ? pkg.packageManager : undefined;
  if (typeof packageManager !== 'string') {
    throw new Error(
      "Missing required 'packageManager' field in package.json",
    );
  }

  const playwrightMinor = extractPlaywrightMinor(playwrightDep);
  const nodeMajor = extractMajor(nodeEngine);
  const pnpmVersion = extractPnpmVersion(packageManager);

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
          path: '.github/actions/setup/action.yml',
          pattern: /node-version:\s*(\d+)/,
        },
        {
          path: '.github/actions/setup-container/action.yml',
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
