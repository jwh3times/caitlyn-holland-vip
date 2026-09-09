import assert from "node:assert/strict";
import { expect } from "@playwright/test";

/** Exercise the real exported Next.js boundary without shipping a crash route.
 * Only this isolated browser context receives a fault-injected external chunk.
 * HTML, CSP, inline scripts, and the error component remain unchanged.
 */
export async function checkErrorBoundary(browser, baseURL, colorScheme) {
  const context = await browser.newContext({ colorScheme, viewport: { width: 390, height: 844 } });
  const marker = "CSP_BOUNDARY_RENDER_PROBE";
  let patched = 0;
  const errors = [];
  try {
    await context.addInitScript(() => {
      window.cspBoundaryFault = true;
      window.cspViolations = [];
      document.addEventListener("securitypolicyviolation", (event) => {
        window.cspViolations.push({
          directive: event.effectiveDirective,
          blocked: event.blockedURI,
        });
      });
    });
    await context.route("**/_next/static/chunks/*.js", async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      // The navigation's closed-menu label is evaluated during render. Keep the
      // fault active across React retries until the test explicitly clears it.
      const label = '"Open menu"';
      if (!body.includes(label)) return route.fulfill({ response });
      assert.equal(body.split(label).length - 1, 1, "Fault seam must identify exactly one label");
      patched++;
      await route.fulfill({
        response,
        body: body.replace(
          label,
          `(()=>{if(window.cspBoundaryFault)throw new Error("${marker}");return ${label}})()`
        ),
      });
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(baseURL);
    await expect(page.getByRole("heading", { name: "Something went wrong!" })).toBeVisible();
    assert.equal(patched, 1, "The navigation render fault must be injected");
    await expect(page.locator("html")).toHaveClass(new RegExp(colorScheme));
    await expect(page.getByRole("link", { name: "Go Home" })).toHaveAttribute("href", "/");
    await page.evaluate(() => {
      window.cspBoundaryFault = false;
    });
    await page.getByRole("button", { name: "Try Again" }).click();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Something went wrong!" })).toHaveCount(0);
    const target = colorScheme === "light" ? "dark" : "light";
    await page.getByRole("button", { name: `Activate ${target} mode` }).click();
    await expect(page.locator("html")).toHaveClass(new RegExp(target));
    await page.waitForLoadState("networkidle");
    assert.deepEqual(
      await page.evaluate(() => window.cspViolations),
      [],
      "Error UI and recovery must satisfy CSP"
    );
    assert.deepEqual(
      errors.filter((message) => message !== marker),
      [],
      "No unexpected boundary errors"
    );
  } finally {
    await context.close();
  }
}
