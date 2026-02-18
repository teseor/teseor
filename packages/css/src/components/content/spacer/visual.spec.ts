import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromHtmlDocs } from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'docs.html');

test.describe('spacer visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    // skip validateGridRhythm: spacer has no intrinsic height
    await saveForLostPixel(page, 'spacer');
    await expect(page.locator('body')).toHaveScreenshot('visual.png');
  });
});
