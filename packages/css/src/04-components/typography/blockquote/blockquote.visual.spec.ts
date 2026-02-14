import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs, validateGridRhythm } from '../../../testing';

const DOCS_PATH = resolve(__dirname, 'blockquote.docs.json');

test.describe('blockquote visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    await validateGridRhythm(page, 'blockquote');
    await saveForLostPixel(page, 'blockquote');
    await expect(page.locator('body')).toHaveScreenshot('blockquote.visual.png');
  });
});
