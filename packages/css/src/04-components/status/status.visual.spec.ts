import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'status.docs.json');

test.describe('status visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'status');
    await saveForLostPixel(page, 'status');
    await expect(page.locator('body')).toHaveScreenshot('status.visual.png');
  });
});
