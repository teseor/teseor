import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'input.docs.json');

test.describe('input visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'input');
    await saveForLostPixel(page, 'input');
    await expect(page.locator('body')).toHaveScreenshot('input.visual.png');
  });
});
