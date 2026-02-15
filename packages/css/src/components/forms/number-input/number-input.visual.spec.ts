import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../../testing';

const DOCS_PATH = resolve(__dirname, 'number-input.docs.json');

test.describe('number-input visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'number-input');
    await saveForLostPixel(page, 'number-input');
    await expect(page.locator('body')).toHaveScreenshot('number-input-visual.png');
  });
});
