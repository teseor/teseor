import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'search-input.docs.html');

test.describe('search-input visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'search-input');
    await saveForLostPixel(page, 'search-input');
    await expect(page.locator('body')).toHaveScreenshot('search-input.visual.png');
  });
});
