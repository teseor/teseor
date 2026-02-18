import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'pagination.docs.html');

test.describe('pagination visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'pagination');
    await saveForLostPixel(page, 'pagination');
    await expect(page.locator('body')).toHaveScreenshot('pagination.visual.png');
  });
});
