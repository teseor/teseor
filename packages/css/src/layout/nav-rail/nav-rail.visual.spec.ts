import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'nav-rail.docs.json');

test.describe('nav-rail visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'nav-rail');
    await saveForLostPixel(page, 'nav-rail');
    await expect(page.locator('body')).toHaveScreenshot('nav-rail.visual.png');
  });
});
