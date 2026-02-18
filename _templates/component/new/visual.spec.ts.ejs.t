---
to: packages/css/src/components/<%= group %>/<%= name %>/visual.spec.ts
---
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromHtmlDocs, validateGridRhythm } from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'docs.html');

test.describe('<%= name %> visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, '<%= name %>');
    await saveForLostPixel(page, '<%= name %>');
    await expect(page.locator('body')).toHaveScreenshot('visual.png');
  });
});
