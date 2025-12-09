import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'label.docs.json');

test.describe('label visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'label');
    await saveForLostPixel(page, 'label');
    await expect(page.locator('body')).toHaveScreenshot('label.visual.png');
  });
});
