import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'footer.docs.json');

test.describe('footer visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'footer');
    await saveForLostPixel(page, 'footer');
    await expect(page.locator('body')).toHaveScreenshot('footer.visual.png');
  });
});
