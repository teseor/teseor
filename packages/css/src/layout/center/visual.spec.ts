import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromHtmlDocs } from '../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'center.docs.html');

test.describe('center visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await saveForLostPixel(page, 'center');
    await expect(page.locator('body')).toHaveScreenshot('center.visual.png');
  });
});
