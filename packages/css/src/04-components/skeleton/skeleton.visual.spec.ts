import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'skeleton.docs.json');

test.describe('skeleton visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'skeleton');
    await saveForLostPixel(page, 'skeleton');
    await expect(page.locator('body')).toHaveScreenshot('skeleton.visual.png');
  });
});
