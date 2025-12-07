import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'tabs.docs.json');

test.describe('tabs visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await saveForLostPixel(page, 'tabs');
    await expect(page.locator('body')).toHaveScreenshot('tabs.visual.png');
  });
});
