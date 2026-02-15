import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../../testing';

const DOCS_PATH = resolve(__dirname, 'list.docs.json');

test.describe('list visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'list');
    await saveForLostPixel(page, 'list');
    await expect(page.locator('body')).toHaveScreenshot('list.visual.png');
  });
});
