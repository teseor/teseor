import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../../testing';

const DOCS_PATH = resolve(__dirname, 'mark.docs.json');

test.describe('mark visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'mark');
    await saveForLostPixel(page, 'mark');
    await expect(page.locator('body')).toHaveScreenshot('mark.visual.png');
  });
});
