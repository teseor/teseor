import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from '@playwright/test';

const LOSTPIXEL_DIR = resolve(__dirname, '../../.lostpixel');
import type { ComponentAPI } from './api-types';
import { generateVariationsHtml } from './html-generator';
import { scaffoldCss } from './scaffold';

interface DocsItem {
  tag?: string;
  class?: string;
  text?: string;
  attrs?: Record<string, string>;
  style?: Record<string, string>;
  children?: DocsItem[];
}

interface DocsExample {
  html?: string;
  items?: DocsItem[];
  layout?: string;
  title?: string;
}

interface DocsSection {
  title: string;
  examples: DocsExample[];
}

interface DocsJson {
  sections: DocsSection[];
}

const DIST_PATH = resolve(__dirname, '../../dist');

export function loadCss(filename = 'index.css'): string {
  return readFileSync(resolve(DIST_PATH, filename), 'utf-8');
}

export function loadComponentApi(apiPath: string): ComponentAPI {
  return JSON.parse(readFileSync(apiPath, 'utf-8'));
}

function renderItem(item: DocsItem): string {
  if (!item.tag) return item.text ?? '';

  const parts: string[] = [];

  if (item.class) parts.push(`class="${item.class}"`);

  if (item.style) {
    const css = Object.entries(item.style)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
    parts.push(`style="${css}"`);
  }

  if (item.attrs) {
    for (const [k, v] of Object.entries(item.attrs)) {
      parts.push(v === '' ? k : `${k}="${v}"`);
    }
  }

  const attrStr = parts.length ? ` ${parts.join(' ')}` : '';
  const content = item.children ? item.children.map(renderItem).join('\n') : (item.text ?? '');

  return `<${item.tag}${attrStr}>${content}</${item.tag}>`;
}

export function loadDocsJson(docsPath: string): DocsJson {
  return JSON.parse(readFileSync(docsPath, 'utf-8'));
}

export function generateHtmlFromDocs(docs: DocsJson): string {
  const sections: string[] = [];

  for (const section of docs.sections) {
    const examples: string[] = [];

    for (const example of section.examples) {
      let html = '';

      if (example.html) {
        html = example.html;
      } else if (example.items) {
        const items = example.items.map(renderItem).join('\n');
        html = example.layout === 'row' ? `<div class="ui-row">${items}</div>` : items;
      }

      if (html) {
        examples.push(`<div class="test-example">${html}</div>`);
      }
    }

    sections.push(`
      <div class="test-section">
        <div class="test-section-title">${section.title}</div>
        ${examples.join('\n')}
      </div>
    `);
  }

  return `<div class="test-container">${sections.join('')}</div>`;
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

export async function setupVisualTestFromDocs(page: Page, docsPath: string): Promise<void> {
  const docs = loadDocsJson(docsPath);
  const html = generateHtmlFromDocs(docs);
  await setupVisualTest(page, { html });
}

export async function saveForLostPixel(page: Page, name: string): Promise<void> {
  mkdirSync(LOSTPIXEL_DIR, { recursive: true });
  const screenshot = await page.screenshot({ fullPage: true });
  writeFileSync(resolve(LOSTPIXEL_DIR, `${name}.png`), screenshot);
}
