import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromHtmlDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'docs.html');

test.describe('data-list visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromHtmlDocs(page, DOCS_PATH);
    // TODO: fix grid rhythm - 1px borders cause off-grid heights (#179)
    // await validateGridRhythm(page, 'data-list');
    await saveForLostPixel(page, 'data-list');
    await expect(page.locator('body')).toHaveScreenshot('visual.png');
  });
});
