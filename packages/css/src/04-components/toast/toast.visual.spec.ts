import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'toast.docs.json');

test.describe('toast visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'toast');
    await saveForLostPixel(page, 'toast');
    await expect(page.locator('body')).toHaveScreenshot('toast.visual.png');
  });
});
