import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'close-button.docs.html');

test.describe('close-button visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'close-button');
    await saveForLostPixel(page, 'close-button');
    await expect(page.locator('body')).toHaveScreenshot('close-button.visual.png');
  });
});
