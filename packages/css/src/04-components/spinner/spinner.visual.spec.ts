import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'spinner.docs.json');

test.describe('spinner visual regression', () => {
  // TODO: Skip grid rhythm until #154 is resolved (CSS var resolution issue)
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    // await validateGridRhythm(page, 'spinner');
    await saveForLostPixel(page, 'spinner');
    await expect(page.locator('body')).toHaveScreenshot('spinner.visual.png');
  });
});
