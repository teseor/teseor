import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'tooltip.docs.html');

test.describe('tooltip visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'tooltip');
    await saveForLostPixel(page, 'tooltip');
    await expect(page.locator('body')).toHaveScreenshot('tooltip.visual.png');
  });
});
