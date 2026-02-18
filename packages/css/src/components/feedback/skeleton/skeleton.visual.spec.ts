import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'skeleton.docs.html');

test.describe('skeleton visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'skeleton');
    await saveForLostPixel(page, 'skeleton');
    await expect(page.locator('body')).toHaveScreenshot('skeleton.visual.png');
  });
});
