import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'docs.html');

test.describe('progress-circle visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'progress-circle');
    await saveForLostPixel(page, 'progress-circle');
    await expect(page.locator('body')).toHaveScreenshot('visual.png');
  });
});
