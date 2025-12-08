import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'field.docs.json');

test.describe('field visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'field');
    await saveForLostPixel(page, 'field');
    await expect(page.locator('body')).toHaveScreenshot('field.visual.png');
  });
});
