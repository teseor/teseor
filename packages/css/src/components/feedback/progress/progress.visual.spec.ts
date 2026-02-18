import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'progress.docs.html');

test.describe('progress visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'progress');
    await saveForLostPixel(page, 'progress');
    await expect(page.locator('body')).toHaveScreenshot('progress.visual.png');
  });
});
