import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromApi } from '../../testing';

const API_PATH = resolve(__dirname, 'tabs.api.json');

test.describe('tabs visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromApi(page, API_PATH);
    await saveForLostPixel(page, 'tabs');
    await expect(page.locator('body')).toHaveScreenshot('tabs.visual.png');
  });
});
