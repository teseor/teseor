import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'slider.docs.json');

test.describe('slider visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'slider');
    await saveForLostPixel(page, 'slider');
    await expect(page.locator('body')).toHaveScreenshot('slider.visual.png');
  });
});
