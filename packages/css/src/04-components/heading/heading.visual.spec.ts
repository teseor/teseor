import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'heading.docs.json');

test.describe('heading visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'heading');
    await saveForLostPixel(page, 'heading');
    await expect(page.locator('body')).toHaveScreenshot('heading.visual.png');
  });
});
