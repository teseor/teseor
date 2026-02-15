import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'content.docs.json');

test.describe('content visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'content');
    await saveForLostPixel(page, 'content');
    await expect(page.locator('body')).toHaveScreenshot('content.visual.png');
  });
});
