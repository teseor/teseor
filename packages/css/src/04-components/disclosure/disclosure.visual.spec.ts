import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'disclosure.docs.json');

test.describe('disclosure visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'disclosure');
    await saveForLostPixel(page, 'disclosure');
    await expect(page.locator('body')).toHaveScreenshot('disclosure.visual.png');
  });
});
