import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromApi } from '../../testing';

const API_PATH = resolve(__dirname, 'table.api.json');

test.describe('table visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromApi(page, API_PATH);
    await saveForLostPixel(page, 'table');
    await expect(page.locator('body')).toHaveScreenshot('table.visual.png');
  });
});
