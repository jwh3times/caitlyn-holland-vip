import { test, expect } from "@playwright/test";
import { profile } from "../../lib/profile";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load the homepage with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(new RegExp(profile.name));
  });

  test("should display the hero section with name", async ({ page }) => {
    const heroName = page.locator("h1");
    await expect(heroName).toContainText(profile.name);
  });

  test("should display all main sections", async ({ page }) => {
    await expect(page.locator("#about")).toBeVisible();
    await expect(page.locator("#skills")).toBeVisible();
    await expect(page.locator("#experience")).toBeVisible();
    await expect(page.locator("#contact")).toBeVisible();

    await expect(page.locator("main > section")).toHaveCount(5);
    await expect(
      page.locator("main > section").evaluateAll((sections) => sections.map(({ id }) => id))
    ).resolves.toEqual(["", "about", "skills", "experience", "contact"]);
  });

  test("should have working navigation links", async ({ page, isMobile }) => {
    if (isMobile) {
      const menuButton = page.locator('button[aria-label="Open menu"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
      }
    }

    await page.locator('nav a[href="#about"]:visible').first().click();
    await expect(page.locator("#about")).toBeInViewport();

    if (isMobile) {
      await page.locator('button[aria-label="Open menu"]').click();
    }
    await page.locator('nav a[href="#skills"]:visible').first().click();
    await expect(page.locator("#skills")).toBeInViewport();

    if (isMobile) {
      await page.locator('button[aria-label="Open menu"]').click();
    }
    await page.locator('nav a[href="#experience"]:visible').first().click();
    await expect(page.locator("#experience")).toBeInViewport();

    if (isMobile) {
      const menuButton = page.locator('button[aria-label="Open menu"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
      }
    }

    await page.locator('nav a[href="#contact"]:visible').first().click();
    await expect(page.locator("#contact")).toBeInViewport();
  });

  test("should have a working email link in contact section", async ({ page }) => {
    const emailLink = page.locator('a[href="mailto:caitlyn@holland.vip"]');
    await expect(emailLink).toBeVisible();
  });
});
