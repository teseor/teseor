import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  saveForLostPixel,
  setupVisualTestFromDocs,
  validateGridRhythm,
} from '../../../../test-utils';

const DOCS_PATH = resolve(__dirname, 'radio-group.docs.json');

test.describe('radio-group visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'radio-group');
    await saveForLostPixel(page, 'radio-group');
    await expect(page.locator('body')).toHaveScreenshot('radio-group.visual.png');
  });
});
