import { test, expect } from "@playwright/test";

test.describe("Theme Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should toggle between light and dark mode", async ({ page }) => {
    const themeToggle = page.locator('button[aria-label="Activate dark mode"]').first();
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();

    const darkToggle = page.locator('button[aria-label="Activate light mode"]').first();
    await expect(darkToggle).toBeVisible();
  });
});
