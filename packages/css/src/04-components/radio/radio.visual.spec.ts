import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'radio.docs.json');

test.describe('radio visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'radio');
    await saveForLostPixel(page, 'radio');
    await expect(page.locator('body')).toHaveScreenshot('radio.visual.png');
  });
});
