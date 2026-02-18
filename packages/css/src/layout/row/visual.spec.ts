import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromHtmlDocs } from '../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'docs.html');

test.describe('row visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    // skip validateGridRhythm: row is a layout primitive that
    // controls gap/alignment, not child height
    await saveForLostPixel(page, 'row');
    await expect(page.locator('body')).toHaveScreenshot('visual.png');
  });
});
