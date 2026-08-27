import { test, expect } from "@playwright/test";

test.describe("Mobile Navigation", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should show hamburger menu on mobile", async ({ page }) => {
    const menuButton = page.locator('button[aria-label="Open menu"]');
    await expect(menuButton).toBeVisible();
  });

  test("should open and close mobile menu", async ({ page }) => {
    const menuButton = page.locator('button[aria-label="Open menu"]');
    await menuButton.click();

    const aboutLink = page.locator('nav a[href="#about"]').last();
    await expect(aboutLink).toBeVisible();

    const closeButton = page.locator('button[aria-label="Close menu"]');
    await closeButton.click();
    await expect(aboutLink).not.toBeVisible();
  });
});
