import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'breadcrumb.docs.json');

test.describe('breadcrumb visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'breadcrumb');
    await saveForLostPixel(page, 'breadcrumb');
    await expect(page.locator('body')).toHaveScreenshot('breadcrumb.visual.png');
  });
});
