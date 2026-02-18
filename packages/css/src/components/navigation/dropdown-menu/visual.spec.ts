import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'dropdown-menu.docs.html');

test.describe('dropdown-menu visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'dropdown-menu');
    await saveForLostPixel(page, 'dropdown-menu');
    await expect(page.locator('body')).toHaveScreenshot('dropdown-menu-visual.png');
  });
});
