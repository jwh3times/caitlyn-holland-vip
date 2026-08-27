import { test, expect } from "@playwright/test";

test.describe("Theme Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should toggle between light and dark mode", async ({ page }) => {
    const themeToggle = page.getByRole("button", { name: "Activate dark mode" });
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();

    const darkToggle = page.getByRole("button", { name: "Activate light mode" });
    await expect(darkToggle).toBeVisible();
  });
});
