import { test, expect } from "@playwright/test";
import { profile } from "../../lib/profile";

const expectedDescription =
  "Caitlyn Holland is a Software Engineering Manager at SAS focused on DevOps, integrated quality, automated testing, and helping teams solve challenges.";

test.describe("SEO", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have correct meta description", async ({ page }) => {
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute("content", expectedDescription);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      expectedDescription
    );
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute(
      "content",
      expectedDescription
    );
  });

  test("should have Open Graph tags", async ({ page }) => {
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", profile.name);
  });

  test("should have a manifest link", async ({ page }) => {
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute("href", "/manifest.json");
  });

  test("should publish Person structured data", async ({ page }) => {
    const scripts = page.locator('script[type="application/ld+json"]');
    await expect(scripts).toHaveCount(1);

    const person = JSON.parse((await scripts.textContent()) ?? "") as Record<string, unknown>;
    expect(person).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.name,
      url: profile.siteUrl,
    });
  });
});
