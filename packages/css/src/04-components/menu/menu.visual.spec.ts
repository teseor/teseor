import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'menu.docs.json');

test.describe('menu visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await saveForLostPixel(page, 'menu');
    await expect(page.locator('body')).toHaveScreenshot('menu.visual.png');
  });
});
