import { expect, test } from '@playwright/test';

// Skip in CI - needs docs server running
test.skip(!!process.env.CI, 'Grid alignment test requires docs server');

// Elements that THEMSELVES don't follow grid (fluid page containers only)
const SKIP_SELF_SELECTORS = [
  // Page structure - fluid by nature (viewport-dependent)
  'html',
  'body',
  'main',
  'aside',
  '.ui-sidebar',
  '.ui-main',
  '.ui-app-shell',
];

test('all components should align to vertical grid', async ({ page }) => {
  await page.goto('/');

  const violations = await page.evaluate((skipSelf: string[]) => {
    // Get unit from CSS custom property
    const temp = document.createElement('div');
    temp.style.cssText = 'position:absolute;visibility:hidden;width:var(--unit,0.5rem)';
    document.body.appendChild(temp);
    const unit = temp.getBoundingClientRect().width || 8;
    document.body.removeChild(temp);

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

    const results: Array<{ selector: string; height: number; expected: number; offBy: number }> =
      [];

    for (const el of document.querySelectorAll('*')) {
      const tagName = el.tagName;

      // Skip script, style, link, meta, etc.
      if (['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'HEAD'].includes(tagName)) continue;

      // Skip inline elements
      if (INLINE_TAGS.includes(tagName)) continue;

      // Skip elements that are fluid containers (but check their children)
      if (skipSelf.some((sel) => el.matches(sel))) continue;

      const height = el.getBoundingClientRect().height;
      if (height === 0) continue;

      const remainder = height % unit;
      const isAligned = remainder < 0.5 || remainder > unit - 0.5;

      if (!isAligned) {
        const classes = el.className?.toString?.() || '';
        const firstClass = classes.split(' ')[0];
        results.push({
          selector: `${tagName.toLowerCase()}${firstClass ? `.${firstClass}` : ''}`,
          height: Math.round(height * 10) / 10,
          expected: Math.round(height / unit) * unit,
          offBy: Math.round(remainder * 10) / 10,
        });
      }
    }

    return results;
  }, SKIP_SELF_SELECTORS);

  if (violations.length > 0) {
    console.log(`Found ${violations.length} grid violations:`);
    console.table(violations);
  }

  expect(violations, `Grid violations found:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(
    0,
  );
});
