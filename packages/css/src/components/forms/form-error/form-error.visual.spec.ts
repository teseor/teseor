import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'form-error.docs.html');

test.describe('form-error visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'form-error');
    await saveForLostPixel(page, 'form-error');
    await expect(page.locator('body')).toHaveScreenshot('form-error.visual.png');
  });
});
