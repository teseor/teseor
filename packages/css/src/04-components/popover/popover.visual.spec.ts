import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'popover.docs.json');

test.describe('popover visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'popover');
    await saveForLostPixel(page, 'popover');
    await expect(page.locator('body')).toHaveScreenshot('popover.visual.png');
  });
});
