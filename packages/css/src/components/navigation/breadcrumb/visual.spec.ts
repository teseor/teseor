import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'breadcrumb.docs.html');

test.describe('breadcrumb visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'breadcrumb');
    await saveForLostPixel(page, 'breadcrumb');
    await expect(page.locator('body')).toHaveScreenshot('breadcrumb.visual.png');
  });
});
