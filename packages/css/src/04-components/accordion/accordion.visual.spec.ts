import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'accordion.docs.json');

test.describe('accordion visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'accordion');
    await saveForLostPixel(page, 'accordion');
    await expect(page.locator('body')).toHaveScreenshot('accordion.visual.png');
  });
});
