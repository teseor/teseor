import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'progress-circle.docs.json');

test.describe('progress-circle visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'progress-circle');
    await saveForLostPixel(page, 'progress-circle');
    await expect(page.locator('body')).toHaveScreenshot('progress-circle.visual.png');
  });
});
