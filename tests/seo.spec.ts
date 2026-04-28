import { test, expect } from "@playwright/test";

test.describe("SEO", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have correct meta description", async ({ page }) => {
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute("content", /Caitlyn Holland/);
  });

  test("should have Open Graph tags", async ({ page }) => {
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /Caitlyn Holland/);
  });

  test("should have a manifest link", async ({ page }) => {
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute("href", "/manifest.json");
  });
});
