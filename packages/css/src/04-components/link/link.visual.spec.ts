import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'link.docs.json');

test.describe('link visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'link');
    await saveForLostPixel(page, 'link');
    await expect(page.locator('body')).toHaveScreenshot('link.visual.png');
  });
});
