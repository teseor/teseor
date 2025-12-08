import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'textarea.docs.json');

test.describe('textarea visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'textarea');
    await saveForLostPixel(page, 'textarea');
    await expect(page.locator('body')).toHaveScreenshot('textarea.visual.png');
  });
});
