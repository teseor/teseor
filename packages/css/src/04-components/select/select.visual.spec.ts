import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'select.docs.json');

test.describe('select visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'select');
    await saveForLostPixel(page, 'select');
    await expect(page.locator('body')).toHaveScreenshot('select.visual.png');
  });
});
