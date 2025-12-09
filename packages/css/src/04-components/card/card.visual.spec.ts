import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'card.docs.json');

test.describe('card visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'card');
    await saveForLostPixel(page, 'card');
    await expect(page.locator('body')).toHaveScreenshot('card.visual.png');
  });
});
