import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'toggle.docs.json');

test.describe('toggle visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'toggle');
    await saveForLostPixel(page, 'toggle');
    await expect(page.locator('body')).toHaveScreenshot('toggle.visual.png');
  });
});
