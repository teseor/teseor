import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'sidebar.docs.json');

test.describe('sidebar visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'sidebar');
    await saveForLostPixel(page, 'sidebar');
    await expect(page.locator('body')).toHaveScreenshot('sidebar.visual.png');
  });
});
