import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'drawer.docs.json');

test.describe('drawer visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'drawer');
    await saveForLostPixel(page, 'drawer');
    await expect(page.locator('body')).toHaveScreenshot('drawer.visual.png');
  });
});
