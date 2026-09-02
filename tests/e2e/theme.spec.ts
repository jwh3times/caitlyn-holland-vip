import { test, expect } from "@playwright/test";

test.describe("Theme Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
  });

  test("should toggle between light and dark mode", async ({ page }) => {
    const themeToggle = page.getByRole("button", { name: "Activate dark mode" });
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();

    const darkToggle = page.getByRole("button", { name: "Activate light mode" });
    await expect(darkToggle).toBeVisible();
  });

  test("should restore the selected theme after a page reload", async ({ page }) => {
    await page.getByRole("button", { name: "Activate dark mode" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.reload();

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "Activate light mode" })).toBeVisible();
  });
});
