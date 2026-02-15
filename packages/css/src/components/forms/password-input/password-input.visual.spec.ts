import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../../testing';

const DOCS_PATH = resolve(__dirname, 'password-input.docs.json');

test.describe('password-input visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'password-input');
    await saveForLostPixel(page, 'password-input');
    await expect(page.locator('body')).toHaveScreenshot('password-input-visual.png');
  });
});
