import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'form-helper.docs.json');

test.describe('form-helper visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'form-helper');
    await saveForLostPixel(page, 'form-helper');
    await expect(page.locator('body')).toHaveScreenshot('form-helper.visual.png');
  });
});
