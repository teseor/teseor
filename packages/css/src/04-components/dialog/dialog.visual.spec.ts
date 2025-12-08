import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'dialog.docs.json');

test.describe('dialog visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'dialog');
    await saveForLostPixel(page, 'dialog');
    await expect(page.locator('body')).toHaveScreenshot('dialog.visual.png');
  });
});
