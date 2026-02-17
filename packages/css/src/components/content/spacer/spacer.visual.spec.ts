import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs } from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'spacer.docs.json');

test.describe('spacer visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    // skip validateGridRhythm: spacer has no intrinsic height
    await saveForLostPixel(page, 'spacer');
    await expect(page.locator('body')).toHaveScreenshot('spacer.visual.png');
  });
});
