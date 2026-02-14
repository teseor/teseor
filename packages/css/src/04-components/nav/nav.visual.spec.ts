import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'nav.docs.json');

test.describe('nav visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'nav');
    await saveForLostPixel(page, 'nav');
    await expect(page.locator('body')).toHaveScreenshot('nav.visual.png');
  });
});
