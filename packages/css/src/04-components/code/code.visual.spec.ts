import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'code.docs.json');

test.describe('code visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'code');
    await saveForLostPixel(page, 'code');
    await expect(page.locator('body')).toHaveScreenshot('code.visual.png');
  });
});
