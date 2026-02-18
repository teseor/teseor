import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'menu.docs.html');

test.describe('menu visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'menu');
    await saveForLostPixel(page, 'menu');
    await expect(page.locator('body')).toHaveScreenshot('menu.visual.png');
  });
});
