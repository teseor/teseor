import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../../testing';

const DOCS_PATH = resolve(__dirname, 'image.docs.json');

test.describe('image visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'image');
    await saveForLostPixel(page, 'image');
    await expect(page.locator('body')).toHaveScreenshot('image.visual.png');
  });
});
