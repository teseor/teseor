import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'modal.docs.json');

test.describe('modal visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'modal');
    await saveForLostPixel(page, 'modal');
    await expect(page.locator('body')).toHaveScreenshot('modal.visual.png');
  });
});
