import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from '@playwright/test';

const LOSTPIXEL_DIR = resolve(__dirname, '../../.lostpixel');
import type { ComponentAPI } from './api-types';
import { generateVariationsHtml } from './html-generator';
import { scaffoldCss } from './scaffold';

const DIST_PATH = resolve(__dirname, '../../dist');

export function loadCss(filename = 'index.css'): string {
  return readFileSync(resolve(DIST_PATH, filename), 'utf-8');
}

export function loadComponentApi(apiPath: string): ComponentAPI {
  return JSON.parse(readFileSync(apiPath, 'utf-8'));
}

export async function setupVisualTest(
  page: Page,
  options: {
    html: string;
    css?: string;
    includeTokens?: boolean;
  },
): Promise<void> {
  const { html, css, includeTokens = true } = options;
  const componentCss = includeTokens ? loadCss() : css || '';

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${scaffoldCss}</style>
      <style>${componentCss}</style>
    </head>
    <body>${html}</body>
    </html>
  `;

  await page.setContent(fullHtml);
}

export async function setupVisualTestFromApi(page: Page, apiPath: string): Promise<void> {
  const api = loadComponentApi(apiPath);
  const html = generateVariationsHtml(api);
  await setupVisualTest(page, { html });
}

export async function saveForLostPixel(page: Page, name: string): Promise<void> {
  mkdirSync(LOSTPIXEL_DIR, { recursive: true });
  const screenshot = await page.screenshot({ fullPage: true });
  writeFileSync(resolve(LOSTPIXEL_DIR, `${name}.png`), screenshot);
}
