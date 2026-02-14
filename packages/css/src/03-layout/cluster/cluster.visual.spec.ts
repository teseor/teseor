import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { saveForLostPixel, setupVisualTestFromDocs } from '../../testing';

const DOCS_PATH = resolve(__dirname, 'cluster.docs.json');

test.describe('cluster visual regression', () => {
  test('all variations', async ({ page }) => {
    await setupVisualTestFromDocs(page, DOCS_PATH);
    // skip validateGridRhythm: cluster is a layout primitive that
    // controls gap/alignment, not child height
    await saveForLostPixel(page, 'cluster');
    await expect(page.locator('body')).toHaveScreenshot('cluster.visual.png');
  });
});
