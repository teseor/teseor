import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'alert.docs.json');

test.describe('alert visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'alert');
    await saveForLostPixel(page, 'alert');
    await expect(page.locator('body')).toHaveScreenshot('alert.visual.png');
  });
});
