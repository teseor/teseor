import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromApi } from '../../testing';

const API_PATH = resolve(__dirname, 'code.api.json');

test.describe('code visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromApi(page, API_PATH);
    await saveForLostPixel(page, 'code');
    await expect(page.locator('body')).toHaveScreenshot('code.visual.png');
  });
});
