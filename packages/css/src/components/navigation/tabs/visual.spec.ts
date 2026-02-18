import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'tabs.docs.html');

test.describe('tabs visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'tabs');
    await saveForLostPixel(page, 'tabs');
    await expect(page.locator('body')).toHaveScreenshot('tabs.visual.png');
  });
});
