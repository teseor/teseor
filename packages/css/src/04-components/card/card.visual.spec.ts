import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { setupVisualTestFromApi } from '../../testing';

const API_PATH = resolve(__dirname, 'card.api.json');

test.describe('card visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromApi(page, API_PATH);
    await expect(page.locator('body')).toHaveScreenshot('card.visual.png');
  });
});
