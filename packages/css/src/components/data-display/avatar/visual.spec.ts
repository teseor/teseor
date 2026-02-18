import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'avatar.docs.html');

test.describe('avatar visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'avatar');
    await saveForLostPixel(page, 'avatar');
    await expect(page.locator('body')).toHaveScreenshot('avatar.visual.png');
  });
});
