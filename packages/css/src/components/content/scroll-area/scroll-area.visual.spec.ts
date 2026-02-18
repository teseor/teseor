import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'scroll-area.docs.html');

test.describe('scroll-area visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'scroll-area');
    await saveForLostPixel(page, 'scroll-area');
    await expect(page.locator('body')).toHaveScreenshot('scroll-area-visual.png');
  });
});
