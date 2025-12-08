import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'progress.docs.json');

test.describe('progress visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'progress');
    await saveForLostPixel(page, 'progress');
    await expect(page.locator('body')).toHaveScreenshot('progress.visual.png');
  });
});
