import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'button.docs.json');

test.describe('button visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'button');
    await saveForLostPixel(page, 'button');
    await expect(page.locator('body')).toHaveScreenshot('button.visual.png');
  });
});
