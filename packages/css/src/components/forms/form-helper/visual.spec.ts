import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'form-helper.docs.html');

test.describe('form-helper visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'form-helper');
    await saveForLostPixel(page, 'form-helper');
    await expect(page.locator('body')).toHaveScreenshot('form-helper.visual.png');
  });
});
