import { execSync } from 'node:child_process';

export function lintContentSync(): void {
  try {
    execSync('tsx scripts/generate-content.ts -- --check', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    console.log('Content sync: all content.yml files up to date.');
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string };
    const output = (error.stdout || '') + (error.stderr || '');
    console.error(output);
    process.exit(1);
  }
}
