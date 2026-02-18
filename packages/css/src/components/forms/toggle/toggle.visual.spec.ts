import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'toggle.docs.html');

test.describe('toggle visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'toggle');
    await saveForLostPixel(page, 'toggle');
    await expect(page.locator('body')).toHaveScreenshot('toggle.visual.png');
  });
});
