import { expect, test } from "@playwright/test";

test("playwright runtime smoke", async ({ page }) => {
  await page.setContent("<title>teseor-smoke</title><h1>Teseor</h1>");
  await expect(page).toHaveTitle("teseor-smoke");
  await expect(page.locator("h1")).toHaveText("Teseor");
});
