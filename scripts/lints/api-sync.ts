import { execSync } from 'node:child_process';

export function lintApiSync(): void {
  try {
    execSync('tsx scripts/generate-api.ts -- --check', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    console.log('API sync: all api.json files up to date.');
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string };
    const output = (error.stdout || '') + (error.stderr || '');
    console.error(output);
    process.exit(1);
  }
}
