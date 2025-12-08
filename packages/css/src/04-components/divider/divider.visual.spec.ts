import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'divider.docs.json');

test.describe('divider visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'divider');
    await saveForLostPixel(page, 'divider');
    await expect(page.locator('body')).toHaveScreenshot('divider.visual.png');
  });
});
