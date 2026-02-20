#!/usr/bin/env tsx
// Audit grid rhythm violations across all live docs pages.
// Usage: pnpm audit:grid [base-url]
// Requires the docs dev server running (default: http://localhost:8081)

import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:8081';
const CONTAINER = '.ui-container';

// Same skip lists as rhythm.ts and debug-grid.js
const SKIP_SELECTORS = [
  'html',
  'body',
  'main',
  'aside',
  '.ui-sidebar',
  '.ui-main',
  '.ui-app-shell',
  '.ui-drawer',
  // Decorative/inline elements — don't affect row height
  '.ui-icon',
  '.ui-spinner',
  '.ui-status__dot',
  '.ui-progress__bar',
  '.ui-skeleton',
  '.ui-toggle__track',
  '.ui-toggle__thumb',
  '.ui-avatar',
  '.ui-spacer',
  '.ui-divider',
  '.scroll-progress',
];

const INLINE_TAGS = [
  'STRONG',
  'B',
  'EM',
  'I',
  'SMALL',
  'SPAN',
  'A',
  'CODE',
  'ABBR',
  'CITE',
  'Q',
  'SUB',
  'SUP',
  'MARK',
  'BR',
  'WBR',
];

const SKIP_TAGS = [
  'SCRIPT',
  'STYLE',
  'LINK',
  'META',
  'TITLE',
  'HEAD',
  'SVG',
  'PATH',
  'CIRCLE',
  'RECT',
  'LINE',
  'POLYGON',
  'POLYLINE',
  'ELLIPSE',
  'G',
  'DEFS',
  'USE',
  'SYMBOL',
  'CLIPPATH',
  'MASK',
  'PATTERN',
  'IMAGE',
  'TEXT',
  'TSPAN',
  'TEXTPATH',
  'FOREIGNOBJECT',
];

interface Violation {
  selector: string;
  height: number;
  expected: number;
  offBy: number;
}

interface PageReport {
  url: string;
  violations: Violation[];
}

async function collectPageLinks(page: import('playwright').Page): Promise<string[]> {
  return page.evaluate((base) => {
    const links = new Set<string>();
    for (const a of document.querySelectorAll('a[href]')) {
      const href = (a as HTMLAnchorElement).href;
      if (href.startsWith(base) && !href.includes('#')) {
        links.add(href.replace(/\/$/, ''));
      }
    }
    return [...links].sort();
  }, BASE);
}

async function checkPage(page: import('playwright').Page, url: string): Promise<Violation[]> {
  await page.goto(url, { waitUntil: 'networkidle' });

  return page.evaluate(
    ({ container, skipSelectors, inlineTags, skipTags }) => {
      const root = document.querySelector(container);
      if (!root) return [];

      const temp = document.createElement('div');
      temp.style.cssText = 'position:absolute;visibility:hidden;width:var(--ui-unit, 8px)';
      document.body.appendChild(temp);
      const unit = temp.getBoundingClientRect().width || 8;
      document.body.removeChild(temp);

      const results: Violation[] = [];
      const elements = root.querySelectorAll('*');

      for (const el of elements) {
        const tag = el.tagName.toUpperCase();
        if (skipTags.includes(tag)) continue;
        if (inlineTags.includes(tag)) continue;

        const classes = el.className?.toString?.() || '';
        if (classes.includes('__')) continue;
        if (skipSelectors.some((sel: string) => el.matches(sel))) continue;

        const style = getComputedStyle(el);
        // Skip positioned overlays and decorative containers with aspect-ratio
        if (style.position === 'absolute' || style.position === 'fixed') continue;
        if (style.aspectRatio && style.aspectRatio !== 'auto') continue;

        const height = el.getBoundingClientRect().height;
        if (height === 0 || height < unit / 2) continue;

        const remainder = height % unit;
        const isAligned = remainder < 0.01 || remainder > unit - 0.01;

        if (!isAligned) {
          const firstClass = classes.split(' ')[0];
          results.push({
            selector: `${tag.toLowerCase()}${firstClass ? `.${firstClass}` : ''}`,
            height: Math.round(height * 100) / 100,
            expected: Math.round(height / unit) * unit,
            offBy: Math.round(Math.min(remainder, unit - remainder) * 100) / 100,
          });
        }
      }

      return results;
    },
    {
      container: CONTAINER,
      skipSelectors: SKIP_SELECTORS,
      inlineTags: INLINE_TAGS,
      skipTags: SKIP_TAGS,
    },
  );
}

async function main() {
  console.log(`Auditing grid rhythm on ${BASE}...\n`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  // Collect all page URLs from the home page sidebar
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const urls = await collectPageLinks(page);
  console.log(`Found ${urls.length} pages to check\n`);

  const reports: PageReport[] = [];
  let totalViolations = 0;

  for (const url of urls) {
    const path = url.replace(BASE, '') || '/';
    process.stdout.write(`  ${path} ... `);

    const violations = await checkPage(page, url);
    if (violations.length > 0) {
      reports.push({ url: path, violations });
      totalViolations += violations.length;
      console.log(`${violations.length} violation(s)`);
    } else {
      console.log('OK');
    }
  }

  await browser.close();

  // Summary report
  console.log(`\n${'='.repeat(60)}`);
  if (totalViolations === 0) {
    console.log('No grid rhythm violations found!');
  } else {
    console.log(`${totalViolations} violation(s) across ${reports.length} page(s)\n`);

    // Deduplicate by selector+height across pages
    const unique = new Map<
      string,
      { pages: string[]; selector: string; height: number; expected: number; offBy: number }
    >();
    for (const r of reports) {
      for (const v of r.violations) {
        const key = `${v.selector}@${v.height}`;
        const existing = unique.get(key);
        if (existing) {
          if (!existing.pages.includes(r.url)) existing.pages.push(r.url);
        } else {
          unique.set(key, { pages: [r.url], ...v });
        }
      }
    }

    console.log('Unique violations (deduplicated across pages):\n');
    for (const [, v] of [...unique].sort((a, b) => b[1].pages.length - a[1].pages.length)) {
      console.log(
        `  ${v.selector} — ${v.height}px (expected ${v.expected}px, off by ${v.offBy}px)`,
      );
      console.log(`    pages: ${v.pages.join(', ')}`);
    }
  }
  console.log('='.repeat(60));

  process.exit(totalViolations > 0 ? 1 : 0);
}

main();
