import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'page-header.docs.json');

test.describe('page-header visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'page-header');
    await saveForLostPixel(page, 'page-header');
    await expect(page.locator('body')).toHaveScreenshot('page-header.visual.png');
  });
});
