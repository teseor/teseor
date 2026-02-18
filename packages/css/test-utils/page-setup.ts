import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Page } from '@playwright/test';

const LOSTPIXEL_DIR = resolve(__dirname, '../.lostpixel');
import type { ComponentAPI } from './api-types';
import { generateVariationsHtml } from './html-generator';
import { scaffoldCss } from './scaffold';

// Inline HTML doc parser for test-utils (avoids cross-package import from apps/docs-css)
function parseHtmlDocContent(content: string): {
  frontmatter: Record<string, unknown>;
  sections: { id: string; layout: string | null; rawHtml: string }[];
} {
  let frontmatter: Record<string, unknown> = {};
  let body = content;

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (fmMatch) {
    frontmatter = parseSimpleYaml(fmMatch[1]);
    body = fmMatch[2];
  }

  const sectionRegex = /<!--\s*@(\w+)(?:\s*\|\s*(\w+))?\s*-->/g;
  const sections: { id: string; layout: string | null; rawHtml: string }[] = [];
  let lastIndex = 0;
  let lastSection: { id: string; layout: string | null } | null = null;

  let match = sectionRegex.exec(body);
  while (match !== null) {
    if (lastSection) {
      sections.push({ ...lastSection, rawHtml: body.substring(lastIndex, match.index).trim() });
    }
    lastSection = { id: match[1], layout: match[2] || null };
    lastIndex = match.index + match[0].length;
    match = sectionRegex.exec(body);
  }
  if (lastSection) {
    sections.push({ ...lastSection, rawHtml: body.substring(lastIndex).trim() });
  }
  if (sections.length === 0 && body.trim()) {
    sections.push({ id: 'default', layout: null, rawHtml: body.trim() });
  }

  return { frontmatter, sections };
}

function parseSimpleYaml(raw: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = raw.split('\n');
  let currentKey: string | null = null;
  let currentMap: Record<string, string> | null = null;

  for (const line of lines) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    const topMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    const mapMatch = line.match(/^\s+(\w[\w-]*):\s*(.*)$/);
    if (topMatch && !line.startsWith(' ')) {
      if (currentKey && currentMap) result[currentKey] = currentMap;
      const [, key, val] = topMatch;
      if (val.trim() === '') {
        currentKey = key;
        currentMap = {};
      } else {
        currentKey = null;
        currentMap = null;
        result[key] = parseYamlScalar(val.trim());
      }
    } else if (mapMatch && currentKey && currentMap) {
      currentMap[mapMatch[1]] = String(parseYamlScalar(mapMatch[2].trim()));
    }
  }
  if (currentKey && currentMap) result[currentKey] = currentMap;
  return result;
}

function parseYamlScalar(val: string): string | number | boolean | null {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
    return val.slice(1, -1);
  return val;
}

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

const DIST_PATH = resolve(__dirname, '../dist');

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

// HTML doc support for visual tests
interface HtmlDocSection {
  id: string;
  layout: string | null;
  rawHtml: string;
}

interface HtmlDoc {
  frontmatter: Record<string, unknown>;
  sections: HtmlDocSection[];
}

export function loadHtmlDoc(htmlDocPath: string): HtmlDoc {
  const content = readFileSync(htmlDocPath, 'utf-8');
  return parseHtmlDocContent(content);
}

export function generateHtmlFromHtmlDoc(doc: HtmlDoc, apiPath?: string): string {
  // Load API for Nunjucks template rendering
  let api: Record<string, unknown> | null = null;
  if (apiPath) {
    try {
      api = JSON.parse(readFileSync(apiPath, 'utf-8'));
    } catch {
      // api not found
    }
  }

  const labels = (doc.frontmatter.labels as Record<string, string>) || {};
  const t = (key: string, defaultValue?: string): string => defaultValue ?? key;
  const sections: string[] = [];

  for (const section of doc.sections) {
    // Render Nunjucks templates in rawHtml
    let nunjucks: typeof import('nunjucks') | undefined;
    try {
      nunjucks = require('nunjucks');
    } catch {
      // nunjucks not available in test env, use raw HTML
    }

    let rendered = section.rawHtml;
    if (nunjucks && (rendered.includes('{%') || rendered.includes('{{'))) {
      const env = nunjucks.configure({ autoescape: false });
      rendered = env.renderString(rendered, { api, labels, t });
    }

    // Wrap in layout if specified
    if (section.layout) {
      const layoutClass =
        section.layout === 'row' ? 'ui-row' : section.layout === 'column' ? 'ui-column' : '';
      if (layoutClass) {
        rendered = `<div class="${layoutClass}">${rendered}</div>`;
      }
    }

    const title = section.id.charAt(0).toUpperCase() + section.id.slice(1).replace(/_/g, ' ');

    sections.push(`
      <div class="test-section">
        <div class="test-section-title">${title}</div>
        <div class="test-example">${rendered}</div>
      </div>
    `);
  }

  return `<div class="test-container">${sections.join('')}</div>`;
}

export async function setupVisualTestFromHtmlDocs(page: Page, htmlDocsPath: string): Promise<void> {
  const doc = loadHtmlDoc(htmlDocsPath);
  const fm = doc.frontmatter;
  const apiPath = fm.api ? resolve(dirname(htmlDocsPath), String(fm.api)) : undefined;
  const html = generateHtmlFromHtmlDoc(doc, apiPath);
  await setupVisualTest(page, { html });
}

export async function saveForLostPixel(page: Page, name: string): Promise<void> {
  mkdirSync(LOSTPIXEL_DIR, { recursive: true });
  const screenshot = await page.screenshot({ fullPage: true });
  writeFileSync(resolve(LOSTPIXEL_DIR, `${name}.png`), screenshot);
}
