import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'sidebar-nav.docs.html');

test.describe('sidebar-nav visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'sidebar-nav__item');
    await saveForLostPixel(page, 'sidebar-nav');
    await expect(page.locator('.test-container')).toHaveScreenshot('sidebar-nav-all.png');
  });
});
