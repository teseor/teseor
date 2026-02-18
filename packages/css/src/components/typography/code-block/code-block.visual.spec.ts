import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'code-block.docs.html');

test.describe('code-block visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'code-block');
    await saveForLostPixel(page, 'code-block');
    await expect(page.locator('body')).toHaveScreenshot('code-block.visual.png');
  });
});
