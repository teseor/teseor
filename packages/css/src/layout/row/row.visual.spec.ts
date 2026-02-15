import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'row.docs.json');

test.describe('row visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    // skip validateGridRhythm: row is a layout primitive that
    // controls gap/alignment, not child height
    await saveForLostPixel(page, 'row');
    await expect(page.locator('body')).toHaveScreenshot('row.visual.png');
  });
});
