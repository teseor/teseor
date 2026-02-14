import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../../testing';

const DOCS_PATH = resolve(__dirname, 'stat.docs.json');

test.describe('stat visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'stat');
    await saveForLostPixel(page, 'stat');
    await expect(page.locator('body')).toHaveScreenshot('stat.visual.png');
  });
});
