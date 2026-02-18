import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromHtmlDocs } from '../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'docs.html');

test.describe('aspect-ratio visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    // skip validateGridRhythm: aspect-ratio controls proportions, not fixed heights
    await saveForLostPixel(page, 'aspect-ratio');
    await expect(page.locator('body')).toHaveScreenshot('visual.png');
  });
});
