import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../../testing';

const DOCS_PATH = resolve(__dirname, 'dropdown-menu.docs.json');

test.describe('dropdown-menu visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'dropdown-menu');
    await saveForLostPixel(page, 'dropdown-menu');
    await expect(page.locator('body')).toHaveScreenshot('dropdown-menu-visual.png');
  });
});
