import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'content.docs.html');

test.describe('content visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'content');
    await saveForLostPixel(page, 'content');
    await expect(page.locator('body')).toHaveScreenshot('content.visual.png');
  });
});
