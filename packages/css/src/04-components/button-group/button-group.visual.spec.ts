import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'button-group.docs.json');

test.describe('button-group visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'button-group');
    await saveForLostPixel(page, 'button-group');
    await expect(page.locator('body')).toHaveScreenshot('button-group.visual.png');
  });
});
